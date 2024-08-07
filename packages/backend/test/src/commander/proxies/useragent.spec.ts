import { Logger } from '@nestjs/common';
import {
    ArrayHttpHeaders,
    DatacenterLocalApp,
    SUBSCRIPTION_LOCAL_DEFAULTS,
} from '@scrapoxy/backend-sdk';
import {
    CommanderApp,
    MasterApp,
    TestServers,
    waitFor,
} from '@scrapoxy/backend-test-sdk';
import {
    CONNECTOR_DATACENTER_LOCAL_TYPE,
    countProxiesOnlineViews,
    ONE_MINUTE_IN_MS,
    PROXY_TIMEOUT_DISCONNECTED_DEFAULT_TEST,
    PROXY_TIMEOUT_UNREACHABLE_DEFAULT,
    SCRAPOXY_HEADER_PREFIX_LC,
} from '@scrapoxy/common';
import axios from 'axios';
import { v4 as uuid } from 'uuid';
import type {
    IConnectorDatacenterLocalConfig,
    IConnectorDatacenterLocalCredential,
} from '@scrapoxy/backend-connectors';
import type {
    IConnectorView,
    IProjectData,
    IProjectToCreate,
} from '@scrapoxy/common';


describe(
    'Commander - Proxies - User-Agent',
    () => {
        const logger = new Logger();
        const
            datacenterLocalApp = new DatacenterLocalApp(logger),
            instance = axios.create({
                validateStatus: () => true,
            }),
            projectToCreate: IProjectToCreate = {
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
            },
            servers = new TestServers(),
            uaMapping = new Map<string, string>();
        let
            commanderApp: CommanderApp,
            connector: IConnectorView,
            masterApp: MasterApp,
            project: IProjectData,
            token: string;

        beforeAll(async() => {
            // Start target & local connector
            await Promise.all([
                servers.listen(), datacenterLocalApp.start(),
            ]);

            const subscriptionId = uuid();
            await datacenterLocalApp.client.createSubscription({
                id: subscriptionId,
                ...SUBSCRIPTION_LOCAL_DEFAULTS,
            });

            // Start app
            commanderApp = CommanderApp.defaults({
                datacenterLocalAppUrl: datacenterLocalApp.url,
                fingerprintUrl: servers.urlFingerprint,
                logger,
            });
            await commanderApp.start();
            masterApp = MasterApp.defaults({
                datacenterLocalAppUrl: datacenterLocalApp.url,
                commanderApp,
                fingerprintUrl: servers.urlFingerprint,
                logger,
            });
            await masterApp.start();

            // Create project
            project = await commanderApp.frontendClient.createProject(projectToCreate);

            // Create credential
            const credentialConfigConfig: IConnectorDatacenterLocalCredential = {
                subscriptionId,
            };
            const credential = await commanderApp.frontendClient.createCredential(
                project.id,
                {
                    name: 'mycredential',
                    type: CONNECTOR_DATACENTER_LOCAL_TYPE,
                    config: credentialConfigConfig,
                }
            );

            await waitFor(async() => {
                await commanderApp.frontendClient.getCredentialById(
                    project.id,
                    credential.id
                );

                token = await commanderApp.frontendClient.getProjectTokenById(project.id);
            });

            // Create, install and activate connector
            const connectorConfig: IConnectorDatacenterLocalConfig = {
                region: 'europe',
                size: 'small',
                imageId: void 0,
            };
            connector = await commanderApp.frontendClient.createConnector(
                project.id,
                {
                    name: 'myconnector',
                    proxiesMax: 10,
                    proxiesTimeoutDisconnected: PROXY_TIMEOUT_DISCONNECTED_DEFAULT_TEST,
                    proxiesTimeoutUnreachable: {
                        enabled: true,
                        value: PROXY_TIMEOUT_UNREACHABLE_DEFAULT,
                    },
                    credentialId: credential.id,
                    config: connectorConfig,
                    certificateDurationInMs: 10 * ONE_MINUTE_IN_MS,
                }
            );

            await commanderApp.frontendClient.installConnector(
                project.id,
                connector.id,
                {
                    config: {},
                }
            );

            await waitFor(async() => {
                const connectorFound = await commanderApp.frontendClient.getConnectorById(
                    project.id,
                    connector.id
                );
                const connectorConfigFound = connectorFound.config as IConnectorDatacenterLocalConfig;
                expect(connectorConfigFound.imageId?.length)
                    .toBeGreaterThan(0);
            });

            await commanderApp.frontendClient.activateConnector(
                project.id,
                connector.id,
                true
            );

            await waitFor(
                async() => {
                    const views = await commanderApp.frontendClient.getAllProjectConnectorsAndProxiesById(project.id);
                    expect(countProxiesOnlineViews(views))
                        .toBe(connector.proxiesMax);
                },
                20
            );
        });

        afterAll(async() => {
            await commanderApp.stop();

            await Promise.all([
                masterApp.stop(), datacenterLocalApp.close(), servers.close(),
            ]);
        });

        it(
            'should get all proxies',
            async() => {

                const view = await commanderApp.frontendClient.getAllConnectorProxiesSyncById(
                    project.id,
                    connector.id
                );

                for (const proxy of view.proxies) {
                    uaMapping.set(
                        proxy.id,
                        proxy.useragent
                    );
                }

                expect(uaMapping.size)
                    .toBe(connector.proxiesMax);
            },
            ONE_MINUTE_IN_MS
        );

        it(
            'should not override useragent by default',
            async() => {
                for (let i = 0; i < 100; ++i) {
                    const res = await instance.get(
                        `${servers.urlHttp}/mirror/headers`,
                        {
                            headers: {
                                'User-Agent': 'my_user_agent',
                                'Proxy-Authorization': `Basic ${token}`,
                            },
                            proxy: {
                                host: 'localhost',
                                port: masterApp.masterPort,
                                protocol: 'http',
                            },
                        }
                    );

                    expect(res.status)
                        .toBe(200);

                    const resHeaders = new ArrayHttpHeaders(res.data);
                    expect(resHeaders.getFirstHeader('user-agent'))
                        .toBe('my_user_agent');
                }
            },
            ONE_MINUTE_IN_MS
        );

        it(
            'should update project settings to override useragent',
            async() => {
                await commanderApp.frontendClient.updateProject(
                    project.id,
                    {
                        ...projectToCreate,
                        useragentOverride: true,
                    }
                );

                await waitFor(async() => {
                    const projectFound = await commanderApp.frontendClient.getProjectById(project.id);
                    expect(projectFound.useragentOverride)
                        .toBeTruthy();
                });
            }
        );

        it(
            'should match requests useragent with proxies',
            async() => {
                for (let i = 0; i < 100; ++i) {
                    const res = await instance.get(
                        `${servers.urlHttp}/mirror/headers`,
                        {
                            headers: {
                                'User-Agent': 'my_user_agent',
                                'Proxy-Authorization': `Basic ${token}`,
                            },
                            proxy: {
                                host: 'localhost',
                                port: masterApp.masterPort,
                                protocol: 'http',
                            },
                        }
                    );

                    expect(res.status)
                        .toBe(200);

                    const resHeaders = new ArrayHttpHeaders(res.data);
                    const useragentFound = resHeaders.getFirstHeader('user-agent');
                    const proxyname = res.headers[ `${SCRAPOXY_HEADER_PREFIX_LC}-proxyname` ];
                    const useragentProxy = uaMapping.get(proxyname);

                    expect(useragentFound)
                        .toBe(useragentProxy);
                }
            },
            ONE_MINUTE_IN_MS
        );
    }
);
