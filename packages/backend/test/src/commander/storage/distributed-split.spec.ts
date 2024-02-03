import { Logger } from '@nestjs/common';
import { Transport } from '@nestjs/microservices';
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
    ConnectorDatacenterLocalModule,
    DatacenterLocalApp,
    getEnvStorageDistributedModuleConfig,
    getEnvStorageType,
    LogExceptionFilter,
    MasterModule,
    MasterService,
    RefreshConnectorsModule,
    RefreshFreeproxiesModule,
    RefreshMetricsModule,
    RefreshProxiesModule,
    RefreshTasksModule,
    ScrapoxyExpressAdapter,

    StorageDistributedConnModule,
    StorageDistributedMsModule,
    StorageMongoService,
    SUBSCRIPTION_LOCAL_DEFAULTS,
} from '@scrapoxy/backend-sdk';
import {
    CommanderUsersClient,
    ProxyReverse,
    TestServers,
    USERAGENT_TEST,
    VERSION_TEST,
    waitFor,
} from '@scrapoxy/backend-test-sdk';
import {
    CONNECTOR_DATACENTER_LOCAL_TYPE,
    countProxiesOnlineViews,
    ONE_MINUTE_IN_MS,
    ONE_SECOND_IN_MS,
    PROXY_TIMEOUT_DISCONNECTED_DEFAULT_TEST,
} from '@scrapoxy/common';
import axios from 'axios';
import { v4 as uuid } from 'uuid';
import type {
    INestApplication,
    INestMicroservice,
    LoggerService,
} from '@nestjs/common';
import type { MicroserviceOptions } from '@nestjs/microservices';
import type {
    IConnectorDatacenterLocalConfig,
    IConnectorDatacenterLocalCredential,
} from '@scrapoxy/backend-sdk';
import type { ICommanderFrontendClient } from '@scrapoxy/common';
import type { AddressInfo } from 'net';


async function createDb(
    datacenterLocalApp: DatacenterLocalApp,
    logger: LoggerService
): Promise<INestMicroservice> {
    const moduleRef = await Test.createTestingModule({
        imports: [
            ConnectorDatacenterLocalModule.forRoot({
                url: datacenterLocalApp.url,
            }),
            StorageDistributedMsModule.forRoot(),
        ],
    })
        .setLogger(logger)
        .compile();
    const config = getEnvStorageDistributedModuleConfig();
    const app = moduleRef.createNestMicroservice<MicroserviceOptions>({
        transport: Transport.RMQ,
        options: {
            urls: [
                config.rabbitmq.uri,
            ],
            queue: config.rabbitmq.queueOrders,
            queueOptions: {
                durable: false,
            },
        },
    });
    app.enableShutdownHooks();
    app.useGlobalFilters(new LogExceptionFilter());
    await app.listen();

    return app;
}


async function createApi(
    datacenterLocalApp: DatacenterLocalApp,
    fingerprintUrl: string,
    logger: LoggerService
): Promise<INestApplication> {
    const moduleRef = await Test.createTestingModule({
        imports: [
            AuthLocalModule.forRoot({
                test: true,
            }),
            ConnectorDatacenterLocalModule.forRoot({
                url: datacenterLocalApp.url,
            }),
            CommanderEventsModule.forRoot(),
            CommanderFrontendModule.forRoot(fingerprintUrl),
            CommanderMasterModule.forRoot(),
            CommanderRefreshModule.forRootFromEnv(),
            CommanderScraperModule,
            CommanderUsersModule.forRoot(),
            StorageDistributedConnModule.forRoot(),
        ],
    })
        .setLogger(logger)
        .compile();
    const app = moduleRef.createNestApplication(new ScrapoxyExpressAdapter());
    app.enableShutdownHooks();
    app.useGlobalFilters(new LogExceptionFilter());

    const config = getEnvStorageDistributedModuleConfig();
    app.connectMicroservice({
        transport: Transport.RMQ,
        options: {
            urls: [
                config.rabbitmq.uri,
            ],
            queue: config.rabbitmq.queueEvents,
            queueOptions: {
                durable: false,
            },
        },
    });
    await app.listen(0);

    return app;
}


async function createMaster(
    datacenterLocalApp: DatacenterLocalApp,
    url: string,
    logger: LoggerService
): Promise<INestApplication> {
    const moduleRef = await Test.createTestingModule({
        imports: [
            ConnectorDatacenterLocalModule.forRoot({
                url: datacenterLocalApp.url,
            }),
            MasterModule.forRootFromEnv(
                url,
                VERSION_TEST,
                true,
                0,
                ONE_SECOND_IN_MS
            ),
        ],
    })
        .setLogger(logger)
        .compile();
    const app = moduleRef.createNestApplication();
    app.enableShutdownHooks();
    app.useGlobalFilters(new LogExceptionFilter());
    await app.init();

    return app;
}


async function createRefresh(
    url: string,
    datacenterLocalApp: DatacenterLocalApp,
    fingerprintUrl: string,
    logger: LoggerService
): Promise<INestApplication> {
    const moduleRef = await Test.createTestingModule({
        imports: [
            ConnectorDatacenterLocalModule.forRoot({
                url: datacenterLocalApp.url,
            }),
            RefreshConnectorsModule.forRoot(
                url,
                VERSION_TEST
            ),
            RefreshFreeproxiesModule.forRoot(
                url,
                fingerprintUrl
            ),
            RefreshMetricsModule.forRoot(
                url,
                VERSION_TEST,
                ONE_SECOND_IN_MS
            ),
            RefreshProxiesModule.forRoot(
                url,
                VERSION_TEST,
                true,
                fingerprintUrl
            ),
            RefreshTasksModule.forRoot(
                url,
                VERSION_TEST
            ),
        ],
    })
        .setLogger(logger)
        .compile();
    const app = moduleRef.createNestApplication();
    app.enableShutdownHooks();
    app.useGlobalFilters(new LogExceptionFilter());
    await app.init();

    return app;
}


describe(
    'Commander - Storage - Distributed - Split',
    () => {
        if (getEnvStorageType() !== 'distributed') {
            it(
                'should ignore all tests if storage is not distributed',
                () => void 0
            );

            return;
        }

        const logger = new Logger();
        const
            agents = new Agents(),
            appsApi: INestApplication[] = [],
            appsDb: INestMicroservice[] = [],
            appsMaster: INestApplication[] = [],
            datacenterLocalApp = new DatacenterLocalApp(logger),
            instance = axios.create({
                validateStatus: () => true,
            }),
            rpApi = new ProxyReverse(),
            rpMaster = new ProxyReverse(),
            servers = new TestServers(),
            subscriptionId = uuid();
        let
            appRefresh: INestApplication,
            commander: ICommanderFrontendClient,
            token: string;

        beforeAll(async() => {
            // Start target & local connector
            await Promise.all([
                servers.listen(), datacenterLocalApp.start(),
            ]);

            await datacenterLocalApp.client.createSubscription({
                id: subscriptionId,
                ...SUBSCRIPTION_LOCAL_DEFAULTS,
            });

            // Storage app
            for (let i = 0; i < 2; ++i) {
                const app = await createDb(
                    datacenterLocalApp,
                    logger
                );
                appsDb.push(app);
            }

            // Reset DB
            const mongo = appsDb[ 0 ].get<StorageMongoService>(StorageMongoService);
            await mongo.clean();

            // API app
            await rpApi.listen();

            for (let i = 0; i < 2; ++i) {
                const app = await createApi(
                    datacenterLocalApp,
                    servers.urlFingerprint,
                    logger
                );
                const address = app.getHttpServer()
                    .address() as AddressInfo;
                rpApi.addPort(address.port);
                appsApi.push(app);
            }

            const rpUrl = `http://localhost:${rpApi.port}/api`;

            // Master app
            await rpMaster.listen();

            for (let i = 0; i < 2; ++i) {
                const app = await createMaster(
                    datacenterLocalApp,
                    rpUrl,
                    logger
                );
                const master = app.get<MasterService>(MasterService);
                rpMaster.addPort(master.port as number);
                appsMaster.push(app);
            }

            // Refresh app
            appRefresh = await createRefresh(
                rpUrl,
                datacenterLocalApp,
                servers.urlFingerprint,
                logger
            );

            // Initiate client
            const authClient = await CommanderUsersClient.generateUser(
                rpUrl,
                USERAGENT_TEST
            );
            commander = new CommanderFrontendClient(
                rpUrl,
                USERAGENT_TEST,
                authClient.jwtToken,
                agents
            );
        });

        afterAll(async() => {
            await Promise.all(appsApi.map((app) => app.close()));

            await Promise.all([
                appRefresh.close(),
                ...appsMaster.map((app) => app.close()),
                rpMaster.close(),
                rpApi.close(),
                ...appsDb.map((app) => app.close()),
                datacenterLocalApp.close(),
                servers.close(),
            ]);

            agents.close();
        });

        it(
            'should create a project and a connector, with online proxies',
            async() => {
                // Create project
                const project = await commander.createProject({
                    name: 'myproject',
                    autoRotate: true,
                    autoRotateDelayRange: {
                        min: ONE_MINUTE_IN_MS * 30,
                        max: ONE_MINUTE_IN_MS * 30,
                    },
                    autoScaleUp: true,
                    autoScaleDown: true,
                    autoScaleDownDelay: ONE_MINUTE_IN_MS,
                    cookieSession: true,
                    mitm: true,
                    proxiesMin: 1,
                    useragentOverride: false,
                });
                // Create credential
                const credentialConfigConfig: IConnectorDatacenterLocalCredential = {
                    subscriptionId,
                };
                const credential = await commander.createCredential(
                    project.id,
                    {
                        name: 'mycredential',
                        type: CONNECTOR_DATACENTER_LOCAL_TYPE,
                        config: credentialConfigConfig,
                    }
                );

                await waitFor(async() => {
                    await commander.getCredentialById(
                        project.id,
                        credential.id
                    );

                    token = await commander.getProjectTokenById(project.id);
                });

                // Create, install and activate connector
                const connectorConfig: IConnectorDatacenterLocalConfig = {
                    region: 'europe',
                    size: 'small',
                    imageId: void 0,
                };
                const connector = await commander.createConnector(
                    project.id,
                    {
                        name: 'myconnector',
                        proxiesMax: 10,
                        proxiesTimeoutDisconnected: PROXY_TIMEOUT_DISCONNECTED_DEFAULT_TEST,
                        credentialId: credential.id,
                        config: connectorConfig,
                        certificateDurationInMs: 10 * ONE_MINUTE_IN_MS,
                    }
                );

                await commander.installConnector(
                    project.id,
                    connector.id,
                    {
                        config: {},
                    }
                );

                await waitFor(async() => {
                    const connectorFound = await commander.getConnectorById(
                        project.id,
                        connector.id
                    );
                    const connectorConfigFound = connectorFound.config as IConnectorDatacenterLocalConfig;
                    expect(connectorConfigFound.imageId?.length)
                        .toBeGreaterThan(0);
                });

                await commander.activateConnector(
                    project.id,
                    connector.id,
                    true
                );

                await waitFor(async() => {
                    const views = await commander.getAllProjectConnectorsAndProxiesById(project.id);
                    expect(countProxiesOnlineViews(views))
                        .toBe(connector.proxiesMax);
                });
            }
        );

        it(
            'should make requests',
            async() => {
                for (let i = 0; i < 100; ++i) {
                    const res = await instance.get(
                        `${servers.urlHttp}/file/big`,
                        {
                            headers: {
                                'Proxy-Authorization': `Basic ${token}`,
                            },
                            params: {
                                size: 1024,
                            },
                            proxy: {
                                host: 'localhost',
                                port: rpMaster.port as number,
                                protocol: 'http',
                            },
                        }
                    );

                    expect(res.status)
                        .toBe(200);
                }
            }
        );
    }
);
