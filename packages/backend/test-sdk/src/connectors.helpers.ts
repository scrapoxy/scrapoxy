import { Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
    Agents,
    AuthLocalModule,
    CommanderEventsModule,
    CommanderFrontendClient,
    CommanderFrontendModule,
    CommanderMasterModule,
    CommanderRefreshModule,
    CommanderScraperModule,
    CommanderUsersModule,
    LogExceptionFilter,
    MasterModule,
    MasterService,
    readCaCert,
    RefreshConnectorsModule,
    RefreshFreeproxiesModule,
    RefreshProxiesModule,
    RefreshSourcesModule,
    RefreshTasksModule,
    ScrapoxyExpressAdapter,
    TaskStepError,
} from '@scrapoxy/backend-sdk';
import {
    countProxiesOnlineViews,
    countProxiesViews,
    ICommanderFrontendClient,
    IConnectorToCreate,
    IConnectorToInstall,
    IConnectorView,
    ICredentialToCreate,
    IProjectData,
    isTaskFailed,
    isTaskSucceed,
    ITaskView,
    ONE_HOUR_IN_MS,
    ONE_MINUTE_IN_MS,
    ONE_SECOND_IN_MS,
    PROXY_TIMEOUT_DISCONNECTED_DEFAULT,
    PROXY_TIMEOUT_UNREACHABLE_DEFAULT,
    SCRAPOXY_HEADER_PREFIX,
    sleep,
} from '@scrapoxy/common';
import { SCRAPOXY_PROXY_HEADER_PREFIX_LC } from '@scrapoxy/proxy-sdk';
import axios from 'axios';
import { AgentProxyHttpsTunnel } from './agent-proxy-https-tunnel';
import { CommanderUsersClient } from './commander-users-client';
import {
    USERAGENT_TEST,
    VERSION_TEST,
} from './info';
import { buildStorageModules } from './storageproviders.helpers';
import { waitFor } from './wait-for';
import type {
    INestApplication,
    LoggerService,
} from '@nestjs/common';
import type { ICredentialView } from '@scrapoxy/common';
import type { OutgoingHttpHeaders } from 'http';
import type { AddressInfo } from 'net';


async function waitForTask(
    logger: LoggerService,
    commander: ICommanderFrontendClient,
    project: IProjectData,
    task: ITaskView
) {
    logger.log(`Task (${task.stepCurrent}/${task.stepMax}): ${task.message}`);
    while (true) {
        const sleepTime = Math.max(
            1000,
            task.nextRetryTs - Date.now()
        );
        await sleep(sleepTime);

        task = await commander.getTaskById(
            project.id,
            task.id
        );
        logger.log(`Task (${task.stepCurrent}/${task.stepMax}): ${task.message}`);

        if (isTaskSucceed(task)) {
            break;
        }

        if (isTaskFailed(task)) {
            throw new TaskStepError(
                task.stepCurrent,
                task.message
            );
        }
    }
}


async function createCommanderApp(
    logger: LoggerService,
    connectorModules: any[]
): Promise<INestApplication> {
    const storageModules = buildStorageModules();
    const moduleRefApi = await Test.createTestingModule({
        imports: [
            ...storageModules.modules,
            ...connectorModules,
            AuthLocalModule.forRoot({
                test: true,
            }),
            CommanderEventsModule.forRoot(),
            CommanderFrontendModule.forRoot(VERSION_TEST),
            CommanderMasterModule.forRoot(),
            CommanderRefreshModule.forRootFromEnv(),
            CommanderScraperModule,
            CommanderUsersModule.forRoot(),
        ],
    })
        .setLogger(logger)
        .compile();

    await storageModules.reset(moduleRefApi);

    const app = moduleRefApi.createNestApplication(new ScrapoxyExpressAdapter());
    app.enableShutdownHooks();
    app.useGlobalFilters(new LogExceptionFilter());
    await storageModules.connect(app);
    await app.listen(0);

    return app;
}


async function createMasterApp(
    logger: LoggerService,
    connectorModules: any[],
    commanderAppUrl: string
) {
    const moduleRefProxy = await Test.createTestingModule({
        imports: [
            ...connectorModules,
            MasterModule.forRootFromEnv(
                commanderAppUrl,
                VERSION_TEST,
                true,
                0,
                ONE_SECOND_IN_MS
            ),
            RefreshConnectorsModule.forRoot(
                commanderAppUrl,
                VERSION_TEST
            ),
            RefreshFreeproxiesModule.forRoot(
                commanderAppUrl,
                VERSION_TEST
            ),
            RefreshProxiesModule.forRoot(
                commanderAppUrl,
                VERSION_TEST,
                true
            ),
            RefreshSourcesModule.forRoot(
                commanderAppUrl,
                VERSION_TEST
            ),
            RefreshTasksModule.forRoot(
                commanderAppUrl,
                VERSION_TEST
            ),
        ],
    })
        .setLogger(logger)
        .compile();
    const app = moduleRefProxy.createNestApplication();
    app.enableShutdownHooks();
    app.useGlobalFilters(new LogExceptionFilter());
    await app.init();

    return app;
}


export interface ITestConnector {
    name: string;
    config: any;
    install: any;
}

export interface ITestCredential {
    name: string;
    config: any;
    connectors: ITestConnector[];
}


export function testConnectors(
    jest: { beforeAll: any; afterAll: any; it: any; expect: any },
    agents: Agents,
    connectorModules: any[],
    credentialType: string,
    credentialsTest: ITestCredential[]
) {
    const
        instance = axios.create({
            ...agents.axiosDefaults,
            validateStatus: () => true,
        }),
        logger = new Logger();
    let
        ca: string,
        commander: ICommanderFrontendClient,
        commanderApp: INestApplication,
        masterApp: INestApplication,
        port: number,
        project: IProjectData,
        token: string;

    jest.beforeAll(async() => {
        // Get CA certificate
        ca = await readCaCert();

        // Start app API
        commanderApp = await createCommanderApp(
            logger,
            connectorModules
        );

        // Start app Proxy
        const commanderAppAddress = commanderApp.getHttpServer()
            .address() as AddressInfo;
        const commanderAppUrl = `http://localhost:${commanderAppAddress.port}/api`;

        masterApp = await createMasterApp(
            logger,
            connectorModules,
            commanderAppUrl
        );

        port = masterApp.get<MasterService>(MasterService).port as number;

        // Initiate client
        const authClient = await CommanderUsersClient.generateUser(
            commanderAppUrl,
            USERAGENT_TEST
        );
        commander = new CommanderFrontendClient(
            commanderAppUrl,
            USERAGENT_TEST,
            authClient.jwtToken,
            agents
        );

        // Create project
        project = await commander.createProject({
            name: 'myproject',
            autoRotate: {
                enabled: true,
                min: ONE_MINUTE_IN_MS * 30,
                max: ONE_MINUTE_IN_MS * 30,
            },
            autoScaleUp: true,
            autoScaleDown: {
                enabled: true,
                value: ONE_MINUTE_IN_MS,
            },
            cookieSession: true,
            mitm: true,
            proxiesMin: 1,
            useragentOverride: false,
            ciphersShuffle: false,
        });
        await waitFor(async() => {
            token = await commander.getProjectTokenById(project.id);
        });
    });

    jest.afterAll(async() => {
        await Promise.all([
            masterApp.close(), commanderApp.close(),
        ]);
    });

    for (const credentialTest of credentialsTest) {
        let credential: ICredentialView;

        describe(
            credentialTest.name,
            // eslint-disable-next-line @typescript-eslint/no-loop-func
            () => {
                jest.it(
                    'should create the credential',
                    async() => {
                        const credentialToCreate: ICredentialToCreate = {
                            name: 'mycredential',
                            type: credentialType,
                            config: credentialTest.config,
                        };
                        credential = await commander.createCredential(
                            project.id,
                            credentialToCreate
                        );
                    }
                );

                for (const connectorTest of credentialTest.connectors) {
                    let connector: IConnectorView;

                    describe(
                        connectorTest.name,
                        // eslint-disable-next-line @typescript-eslint/no-loop-func
                        () => {
                            jest.it(
                                'should create the connector',
                                async() => {
                                    const connectorToCreate: IConnectorToCreate = {
                                        name: 'myconnector',
                                        credentialId: credential.id,
                                        proxiesMax: 1,
                                        proxiesTimeoutDisconnected: PROXY_TIMEOUT_DISCONNECTED_DEFAULT,
                                        proxiesTimeoutUnreachable: {
                                            enabled: true,
                                            value: PROXY_TIMEOUT_UNREACHABLE_DEFAULT,
                                        },
                                        config: connectorTest.config ?? {},
                                        certificateDurationInMs: ONE_HOUR_IN_MS,
                                    };
                                    connector = await commander.createConnector(
                                        project.id,
                                        connectorToCreate
                                    );
                                    await waitFor(async() => {
                                        await commander.getConnectorById(
                                            project.id,
                                            connector.id
                                        );
                                    });
                                }
                            );

                            if (connectorTest.install) {
                                jest.it(
                                    'should install the connector',
                                    async() => {
                                        const connectorToInstall: IConnectorToInstall = {
                                            config: connectorTest.install,
                                        };
                                        const task = await commander.installConnector(
                                            project.id,
                                            connector.id,
                                            connectorToInstall
                                        );
                                        await waitForTask(
                                            logger,
                                            commander,
                                            project,
                                            task
                                        );
                                    },
                                    1000 * 60 * 20 // 20 minutes max
                                );

                                jest.it(
                                    'should validate the installation',
                                    async() => {
                                        await commander.validateConnector(
                                            project.id,
                                            connector.id
                                        );

                                        // Copy updated configuration
                                        const connectorFound = await commander.getConnectorById(
                                            project.id,
                                            connector.id
                                        );

                                        Object.assign(
                                            connectorTest.config,
                                            connectorFound.config
                                        );
                                    }
                                );
                            }

                            jest.it(
                                'should activate the connector',
                                async() => {
                                    await commander.activateConnector(
                                        project.id,
                                        connector.id,
                                        true
                                    );

                                    // Wait for proxies
                                    await waitFor(
                                        async() => {
                                            const views = await commander.getAllProjectConnectorsAndProxiesById(project.id);
                                            jest.expect(countProxiesOnlineViews(views))
                                                .toBe(connector.proxiesMax);
                                        },
                                        60 * 5 // 5 minutes max
                                    );
                                },
                                1000 * 60 * 5 // 5 minutes max
                            );

                            let myIp: string;
                            jest.it(
                                'should get a response without proxy',
                                async() => {
                                    const res = await instance.get('https://fingerprint.scrapoxy.io/api/text');

                                    jest.expect(res.status)
                                        .toBe(200);

                                    jest.expect(res.headers).not.toHaveProperty(`${SCRAPOXY_PROXY_HEADER_PREFIX_LC}-proxyname`);

                                    myIp = res.data;
                                    jest.expect(myIp.length)
                                        .toBeGreaterThan(0);

                                }
                            );

                            jest.it(
                                'should get different IPs with HTTP over HTTP',
                                async() => {
                                    const res = await instance.get(
                                        'http://fingerprint.scrapoxy.io/api/text',
                                        {
                                            headers: {
                                                'Proxy-Authorization': `Basic ${token}`,
                                            },
                                            proxy: {
                                                host: 'localhost',
                                                port,
                                                protocol: 'http',
                                            },
                                        }
                                    );

                                    jest.expect(res.status)
                                        .toBe(200);

                                    jest.expect(res.headers)
                                        .toHaveProperty(`${SCRAPOXY_PROXY_HEADER_PREFIX_LC}-proxyname`);

                                    const ip = res.data;

                                    jest.expect(ip.length)
                                        .toBeGreaterThan(0);

                                    jest.expect(myIp).not.toEqual(ip);
                                }
                            );

                            jest.it(
                                'should get different IPs with HTTPS over HTTP',
                                async() => {
                                    const res = await instance.get(
                                        'https://fingerprint.scrapoxy.io/api/text',
                                        {
                                            headers: {
                                                'Proxy-Authorization': `Basic ${token}`,
                                            },
                                            proxy: {
                                                host: 'localhost',
                                                port,
                                                protocol: 'http',
                                            },
                                        }
                                    );

                                    jest.expect(res.status)
                                        .toBe(200);

                                    jest.expect(res.headers)
                                        .toHaveProperty(`${SCRAPOXY_PROXY_HEADER_PREFIX_LC}-proxyname`);

                                    const ip = res.data;

                                    jest.expect(ip.length)
                                        .toBeGreaterThan(0);

                                    jest.expect(myIp).not.toEqual(ip);
                                }
                            );

                            jest.it(
                                'should get different IPs with HTTPS over HTTP tunnel (MITM mode)',
                                async() => {
                                    const httpsAgent = new AgentProxyHttpsTunnel({
                                        hostname: 'localhost',
                                        port,
                                        ca,
                                        headers: {
                                            'Proxy-Authorization': `Basic ${token}`,
                                        },
                                    });

                                    try {
                                        const res = await instance.get(
                                            'https://fingerprint.scrapoxy.io/api/text',
                                            {
                                                httpsAgent,
                                            }
                                        );

                                        jest.expect(res.status)
                                            .toBe(200);

                                        jest.expect(res.headers)
                                            .toHaveProperty(`${SCRAPOXY_PROXY_HEADER_PREFIX_LC}-proxyname`);

                                        const ip = res.data;

                                        jest.expect(ip.length)
                                            .toBeGreaterThan(0);

                                        jest.expect(myIp).not.toEqual(ip);
                                    } finally {
                                        httpsAgent.close();
                                    }
                                }
                            );

                            jest.it(
                                'should get different IPs with HTTPS over HTTP tunnel (tunnel mode)',
                                async() => {
                                    const headersConnect: OutgoingHttpHeaders = {
                                        'Proxy-Authorization': `Basic ${token}`,
                                    };
                                    headersConnect[ `${SCRAPOXY_HEADER_PREFIX}-Mode` ] = 'tunnel';

                                    const httpsAgent = new AgentProxyHttpsTunnel({
                                        hostname: 'localhost',
                                        port,
                                        headers: headersConnect,
                                    });

                                    try {
                                        const res = await instance.get(
                                            'https://fingerprint.scrapoxy.io/api/text',
                                            {
                                                httpsAgent,
                                            }
                                        );

                                        jest.expect(res.status)
                                            .toBe(200);

                                        jest.expect(res.headers).not.toHaveProperty(`${SCRAPOXY_PROXY_HEADER_PREFIX_LC}-proxyname`);

                                        const ip = res.data;

                                        jest.expect(ip.length)
                                            .toBeGreaterThan(0);

                                        jest.expect(myIp).not.toEqual(ip);
                                    } finally {
                                        httpsAgent.close();
                                    }
                                }
                            );

                            jest.it(
                                'should not make a unknown protocol request',
                                async() => {
                                    const res = await instance.get(
                                        'file://c:/windows/win.ini',
                                        {
                                            headers: {
                                                'Proxy-Authorization': `Basic ${token}`,
                                            },
                                            proxy: {
                                                host: 'localhost',
                                                port,
                                                protocol: 'http',
                                            },
                                        }
                                    );

                                    jest.expect(res.status)
                                        .toBe(557);
                                    jest.expect(res.data.message)
                                        .toContain('Unsupported protocol: file:');
                                }
                            );

                            jest.it(
                                'should deactivate the connector',
                                async() => {
                                    await commander.activateConnector(
                                        project.id,
                                        connector.id,
                                        false
                                    );

                                    // Wait for proxies
                                    await waitFor(
                                        async() => {
                                            const views = await commander.getAllProjectConnectorsAndProxiesById(project.id);
                                            jest.expect(countProxiesViews(views))
                                                .toBe(0);
                                        },
                                        60 * 5 // 5 minutes max
                                    );
                                },
                                5 * ONE_MINUTE_IN_MS
                            );

                            if (connectorTest.install) {
                                jest.it(
                                    'should uninstall the connector',
                                    async() => {
                                        const task = await commander.uninstallConnector(
                                            project.id,
                                            connector.id
                                        );
                                        await waitForTask(
                                            logger,
                                            commander,
                                            project,
                                            task
                                        );
                                    },
                                    20 * ONE_MINUTE_IN_MS
                                );
                            }

                            jest.it(
                                'should remove the connector',
                                async() => {
                                    await commander.removeConnector(
                                        project.id,
                                        connector.id
                                    );
                                }
                            );
                        }
                    );
                }

                jest.it(
                    'should remove the credential',
                    async() => {
                        await commander.removeCredential(
                            project.id,
                            credential.id
                        );
                    }
                );
            }
        );
    }
}
