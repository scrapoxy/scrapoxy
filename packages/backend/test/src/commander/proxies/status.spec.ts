import { Logger } from '@nestjs/common';
import {
    AuthLocalModule,
    CommanderEventsModule,
    CommanderFrontendModule,
    CommanderMasterModule,
    CommanderRefreshModule,
    CommanderScraperModule,
    CommanderUsersModule,
    DatacenterLocalApp,
    getEnvCommanderRefreshModuleConfig,
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
    EEventScope,
    EProxyStatus,
    EventsConnectorsClient,
    ONE_MINUTE_IN_MS,
    PROXY_TIMEOUT_DISCONNECTED_DEFAULT_TEST,
} from '@scrapoxy/common';
import { v4 as uuid } from 'uuid';
import type {
    IConnectorDatacenterLocalConfig,
    IConnectorDatacenterLocalCredential,
} from '@scrapoxy/backend-sdk';
import type {
    IConnectorView,
    IProjectData,
} from '@scrapoxy/common';


describe(
    'Commander - Proxies - Status',
    () => {
        const logger = new Logger();
        const
            datacenterLocalApp = new DatacenterLocalApp(logger),
            servers = new TestServers(),
            subscriptionId = uuid();
        let
            client: EventsConnectorsClient,
            commanderApp: CommanderApp,
            connector: IConnectorView,
            masterApp: MasterApp,
            project: IProjectData,
            proxyId: string;

        beforeAll(async() => {
            // Start target & local connector
            await Promise.all([
                servers.listen(), datacenterLocalApp.start(),
            ]);

            await datacenterLocalApp.client.createSubscription({
                id: subscriptionId,
                ...SUBSCRIPTION_LOCAL_DEFAULTS,
            });

            // Start app
            commanderApp = new CommanderApp({
                datacenterLocalAppUrl: datacenterLocalApp.url,
                imports: [
                    AuthLocalModule.forRoot({
                        test: true,
                    }),
                    CommanderEventsModule.forRoot(),
                    CommanderFrontendModule.forRoot(servers.urlFingerprint),
                    CommanderMasterModule.forRoot(),
                    CommanderRefreshModule.forRoot(getEnvCommanderRefreshModuleConfig()),
                    CommanderScraperModule,
                    CommanderUsersModule.forRoot(),
                ],
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
            project = await commanderApp.frontendClient.createProject({
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
                    proxiesMax: 0,
                    proxiesTimeoutDisconnected: PROXY_TIMEOUT_DISCONNECTED_DEFAULT_TEST,
                    proxiesTimeoutUnreachable: {
                        enabled: true,
                        value: 3000,
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

            // Connect events
            const views = await commanderApp.frontendClient.getAllProjectConnectorsAndProxiesById(project.id);
            client = new EventsConnectorsClient(commanderApp.events);

            await commanderApp.events.registerAsync({
                scope: EEventScope.PROJECT,
                projectId: project.id,
            });
            await client.subscribeAsync(
                project.id,
                views
            );
        });

        afterAll(async() => {
            // Disconnect events
            await client.unsubscribeAsync();

            await commanderApp.stop();

            await Promise.all([
                masterApp.stop(), datacenterLocalApp.close(), servers.close(),
            ]);
        });

        it(
            'should scale 1 proxy',
            async() => {
                await datacenterLocalApp.client.updateSubscription(
                    subscriptionId,
                    {
                        ...SUBSCRIPTION_LOCAL_DEFAULTS,
                        transitionStartingToStarted: false,
                    }
                );

                await commanderApp.frontendClient.scaleConnector(
                    project.id,
                    connector.id,
                    1
                );

                await waitFor(() => {
                    expect(client.views[ 0 ].connector.proxiesMax)
                        .toBe(1);
                });

                connector = await commanderApp.frontendClient.getConnectorById(
                    project.id,
                    connector.id
                );

                expect(connector.proxiesMax)
                    .toBe(1);
            }
        );

        it(
            'should have 1 starting proxy',
            async() => {
                await waitFor(() => {
                    expect(client.views[ 0 ].proxies)
                        .toHaveLength(1);

                    const proxy = client.views[ 0 ].proxies[ 0 ];
                    expect(proxy.status)
                        .toBe(EProxyStatus.STARTING);
                });

                const view = await commanderApp.frontendClient.getAllConnectorProxiesSyncById(
                    project.id,
                    connector.id
                );
                expect(view.proxies)
                    .toHaveLength(1);

                const proxy = view.proxies[ 0 ];
                proxyId = proxy.id;
                expect(proxy.status)
                    .toBe(EProxyStatus.STARTING);
            }
        );

        it(
            'should renew the proxy',
            async() => {
                await waitFor(
                    () => {
                        expect(client.views[ 0 ].proxies)
                            .toHaveLength(1);

                        const proxy = client.views[ 0 ].proxies[ 0 ];
                        expect(proxy.id).not.toBe(proxyId);
                    },
                    20
                );

                const view = await commanderApp.frontendClient.getAllConnectorProxiesSyncById(
                    project.id,
                    connector.id
                );
                expect(view.proxies)
                    .toHaveLength(1);

                const proxy = view.proxies[ 0 ];
                expect(proxy.id).not.toBe(proxyId);
            }
        );

        it(
            'should have 1 started proxy',
            async() => {
                await datacenterLocalApp.client.updateSubscription(
                    subscriptionId,
                    {
                        ...SUBSCRIPTION_LOCAL_DEFAULTS,
                        transitionStartingToStarted: true,
                    }
                );

                await waitFor(() => {
                    expect(client.views[ 0 ].proxies)
                        .toHaveLength(1);

                    const proxy = client.views[ 0 ].proxies[ 0 ];
                    expect(proxy.status)
                        .toBe(EProxyStatus.STARTED);
                });

                const view = await commanderApp.frontendClient.getAllConnectorProxiesSyncById(
                    project.id,
                    connector.id
                );
                expect(view.proxies)
                    .toHaveLength(1);

                const proxy = view.proxies[ 0 ];
                expect(proxy.status)
                    .toBe(EProxyStatus.STARTED);
            }
        );

        it(
            'should have 1 stopping proxy',
            async() => {
                await datacenterLocalApp.client.updateSubscription(
                    subscriptionId,
                    {
                        ...SUBSCRIPTION_LOCAL_DEFAULTS,
                        transitionStoppingToStopped: false,
                    }
                );

                await commanderApp.frontendClient.activateConnector(
                    project.id,
                    connector.id,
                    false
                );

                await waitFor(() => {
                    expect(client.views[ 0 ].proxies)
                        .toHaveLength(1);

                    const proxy = client.views[ 0 ].proxies[ 0 ];
                    expect(proxy.status)
                        .toBe(EProxyStatus.STOPPING);
                });

                const view = await commanderApp.frontendClient.getAllConnectorProxiesSyncById(
                    project.id,
                    connector.id
                );
                expect(view.proxies)
                    .toHaveLength(1);

                const proxy = view.proxies[ 0 ];
                expect(proxy.status)
                    .toBe(EProxyStatus.STOPPING);
            }
        );

        it(
            'should have 1 stopped proxy',
            async() => {
                await datacenterLocalApp.client.updateSubscription(
                    subscriptionId,
                    {
                        ...SUBSCRIPTION_LOCAL_DEFAULTS,
                        transitionStoppingToStopped: true,
                    }
                );

                await waitFor(() => {
                    expect(client.proxiesCount)
                        .toBe(0);
                });

                const view = await commanderApp.frontendClient.getAllConnectorProxiesSyncById(
                    project.id,
                    connector.id
                );
                expect(view.proxies)
                    .toHaveLength(0);
            }
        );
    }
);
