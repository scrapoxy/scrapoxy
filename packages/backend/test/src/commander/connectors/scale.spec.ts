import { Logger } from '@nestjs/common';
import {
    ConnectorNotFoundError,
    DatacenterLocalApp,
    SUBSCRIPTION_LOCAL_DEFAULTS,
    ValidationError,
} from '@scrapoxy/backend-sdk';
import {
    CommanderApp,
    MasterApp,
    TestServers,
    waitFor,
} from '@scrapoxy/backend-test-sdk';
import {
    CONNECTOR_DATACENTER_LOCAL_TYPE,
    countProxiesOnlineView,
    countProxiesOnlineViews,
    countProxiesViews,
    EEventScope,
    EventsConnectorsClient,
    ONE_MINUTE_IN_MS,
    PROXY_TIMEOUT_DISCONNECTED_DEFAULT_TEST,
    PROXY_TIMEOUT_UNREACHABLE_DEFAULT,
} from '@scrapoxy/common';
import { v4 as uuid } from 'uuid';
import type {
    IConnectorDatacenterLocalConfig,
    IConnectorDatacenterLocalCredential,
} from '@scrapoxy/backend-sdk';
import type {
    IConnectorView,
    ICredentialView,
    IProjectData,
    IProxyView,
} from '@scrapoxy/common';


describe(
    'Commander - Connectors - Scale',
    () => {
        const logger = new Logger();
        const
            datacenterLocalApp = new DatacenterLocalApp(logger),
            servers = new TestServers();
        let
            client: EventsConnectorsClient,
            commanderApp: CommanderApp,
            connector: IConnectorView,
            connector2: IConnectorView,
            credential: ICredentialView,
            credential2: ICredentialView,
            masterApp: MasterApp,
            project: IProjectData,
            proxy: IProxyView,
            subscriptionId: string;

        beforeAll(async() => {
            // Start target & local connector
            await Promise.all([
                servers.listen(), datacenterLocalApp.start(),
            ]);

            subscriptionId = uuid();
            await datacenterLocalApp.client.createSubscription({
                id: subscriptionId,
                ...SUBSCRIPTION_LOCAL_DEFAULTS,
            });

            const subscriptionId2 = uuid();
            await datacenterLocalApp.client.createSubscription({
                id: subscriptionId2,
                ...SUBSCRIPTION_LOCAL_DEFAULTS,
            });

            // Start app
            commanderApp = CommanderApp.defaults({
                datacenterLocalAppUrl: datacenterLocalApp.url,
                fingerprintUrl: servers.urlFingerprint,
                logger,
            });
            await commanderApp.start();

            client = new EventsConnectorsClient(commanderApp.events);

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
            const credentialConfig: IConnectorDatacenterLocalCredential = {
                subscriptionId,
            };

            credential = await commanderApp.frontendClient.createCredential(
                project.id,
                {
                    name: 'mycredential',
                    type: CONNECTOR_DATACENTER_LOCAL_TYPE,
                    config: credentialConfig,
                }
            );

            const credentialConfig2: IConnectorDatacenterLocalCredential = {
                subscriptionId: subscriptionId2,
            };
            credential2 = await commanderApp.frontendClient.createCredential(
                project.id,
                {
                    name: 'mycredential2',
                    type: CONNECTOR_DATACENTER_LOCAL_TYPE,
                    config: credentialConfig2,
                }
            );
            await waitFor(async() => {
                await Promise.all([
                    commanderApp.frontendClient.getCredentialById(
                        project.id,
                        credential.id
                    ),
                    commanderApp.frontendClient.getCredentialById(
                        project.id,
                        credential2.id
                    ),
                ]);
            });

            // Connect events
            await Promise.all([
                client.subscribeAsync(
                    project.id,
                    []
                ),
                commanderApp.events.registerAsync({
                    scope: EEventScope.PROJECT,
                    projectId: project.id,
                }),
            ]);
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
            'should not scale unknown connector',
            async() => {
                await expect(commanderApp.frontendClient.scaleConnector(
                    project.id,
                    uuid(),
                    1
                ))
                    .rejects
                    .toThrowError(ConnectorNotFoundError);
            }
        );

        it(
            'should create, install and activate a first connector without proxy',
            async() => {
                const connectorConfig: IConnectorDatacenterLocalConfig = {
                    region: 'europe',
                    size: 'small',
                    imageId: void 0,
                };

                connector = await commanderApp.frontendClient.createConnector(
                    project.id,
                    {
                        name: 'myconnector',
                        credentialId: credential.id,
                        proxiesMax: 0,
                        proxiesTimeoutDisconnected: PROXY_TIMEOUT_DISCONNECTED_DEFAULT_TEST,
                        proxiesTimeoutUnreachable: {
                            enabled: true,
                            value: PROXY_TIMEOUT_UNREACHABLE_DEFAULT,
                        },
                        config: connectorConfig,
                        certificateDurationInMs: 10 * ONE_MINUTE_IN_MS,
                    }
                );
                expect(connector.proxiesMax)
                    .toBe(0);

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

                await waitFor(() => {
                    expect(client.views[ 0 ].connector.active)
                        .toBeTruthy();
                });

                connector = await commanderApp.frontendClient.getConnectorById(
                    project.id,
                    connector.id
                );
                expect(connector.active)
                    .toBeTruthy();
            }
        );

        it(
            'should not scale up with negative number of proxies',
            async() => {
                await expect(commanderApp.frontendClient.scaleConnector(
                    project.id,
                    connector.id,
                    -10
                ))
                    .rejects
                    .toThrowError(ValidationError);
            }
        );

        it(
            'should not scale up too much requests by proxies',
            async() => {
                await commanderApp.frontendClient.scaleConnector(
                    project.id,
                    connector.id,
                    101
                );

                await waitFor(() => {
                    expect(client.views[ 0 ].connector.error)
                        .toContain('Cannot create more instances than max limit');
                });

                const connectorFound = await commanderApp.frontendClient.getConnectorById(
                    project.id,
                    connector.id
                );

                expect(connectorFound.error)
                    .toContain('Cannot create more instances than max limit');
            }
        );

        it(
            'should scale up to 1 proxy',
            async() => {
                await commanderApp.frontendClient.scaleConnector(
                    project.id,
                    connector.id,
                    1
                );

                await waitFor(() => {
                    expect(client.proxiesOnlineCount)
                        .toBe(1);
                    expect(client.views[ 0 ].connector.error)
                        .toBeNull();
                });

                const view = await commanderApp.frontendClient.getAllConnectorProxiesById(
                    project.id,
                    connector.id
                );
                expect(countProxiesOnlineView(view))
                    .toBe(1);
                expect(view.connector.error)
                    .toBeNull();

                proxy = view.proxies[ 0 ];
            }
        );

        it(
            'should not ask to replace no proxy',
            async() => {
                await expect(commanderApp.frontendClient.askProxiesToRemove(
                    project.id,
                    []
                ))
                    .rejects
                    .toThrowError(ValidationError);
            }
        );

        it(
            'should replace the proxy normally',
            async() => {
                await commanderApp.frontendClient.askProxiesToRemove(
                    project.id,
                    [
                        {
                            id: proxy.id, force: false,
                        },
                    ]
                );

                await waitFor(() => {
                    expect(client.views[ 0 ].proxies[ 0 ].removing)
                        .toBeTruthy();
                });

                const view = await commanderApp.frontendClient.getAllConnectorProxiesSyncById(
                    project.id,
                    connector.id
                );
                expect(view.proxies[ 0 ].removing)
                    .toBeTruthy();

                await waitFor(() => {
                    expect(client.proxiesOnlineCount)
                        .toBe(1);

                    expect(client.views[ 0 ].connector.error)
                        .toBeNull();

                    expect(client.views[ 0 ].proxies[ 0 ].id)
                        .not.toBe(proxy);

                    expect(client.views[ 0 ].proxies[ 0 ].removing)
                        .toBeFalsy();
                });

                const views = await commanderApp.frontendClient.getAllProjectConnectorsAndProxiesById(project.id);
                expect(countProxiesOnlineViews(views))
                    .toBe(1);

                expect(views[ 0 ].proxies[ 0 ].id).not.toBe(proxy);

                expect(views[ 0 ].connector.error)
                    .toBeNull();

                const subscription = await datacenterLocalApp.client.getSubscription(subscriptionId);
                expect(subscription.removeForcedCount)
                    .toBe(0);

                proxy = views[ 0 ].proxies[ 0 ];
            }
        );

        it(
            'should force to replace the proxy',
            async() => {
                await commanderApp.frontendClient.askProxiesToRemove(
                    project.id,
                    [
                        {
                            id: proxy.id, force: true,
                        },
                    ]
                );

                await waitFor(
                    () => {
                        expect(client.views[ 0 ].proxies[ 0 ].removing)
                            .toBeTruthy();
                    },
                    20
                );

                const view = await commanderApp.frontendClient.getAllConnectorProxiesSyncById(
                    project.id,
                    connector.id
                );
                expect(view.proxies[ 0 ].removing)
                    .toBeTruthy();

                await waitFor(() => {
                    expect(client.proxiesOnlineCount)
                        .toBe(1);

                    expect(client.views[ 0 ].connector.error)
                        .toBeNull();

                    expect(client.views[ 0 ].proxies[ 0 ].id)
                        .not.toBe(proxy);

                    expect(client.views[ 0 ].proxies[ 0 ].removing)
                        .toBeFalsy();
                });

                const views = await commanderApp.frontendClient.getAllProjectConnectorsAndProxiesById(project.id);
                expect(countProxiesOnlineViews(views))
                    .toBe(1);

                expect(views[ 0 ].proxies[ 0 ].id).not.toBe(proxy);

                expect(views[ 0 ].connector.error)
                    .toBeNull();

                const subscription = await datacenterLocalApp.client.getSubscription(subscriptionId);
                expect(subscription.removeForcedCount)
                    .toBe(1);
            },
            ONE_MINUTE_IN_MS
        );

        it(
            'should scale up to 2 proxies',
            async() => {
                await commanderApp.frontendClient.scaleConnector(
                    project.id,
                    connector.id,
                    2
                );

                await waitFor(() => {
                    expect(client.proxiesOnlineCount)
                        .toBe(2);

                    expect(client.views[ 0 ].connector.error)
                        .toBeNull();
                });

                const views = await commanderApp.frontendClient.getAllProjectConnectorsAndProxiesById(project.id);
                expect(countProxiesOnlineViews(views))
                    .toBe(2);

                expect(views[ 0 ].connector.error)
                    .toBeNull();
            }
        );

        it(
            'should create, install and activate a second connector with 2 proxies',
            async() => {
                const connectorConfig: IConnectorDatacenterLocalConfig = {
                    region: 'asia',
                    size: 'large',
                    imageId: void 0,
                };
                connector2 = await commanderApp.frontendClient.createConnector(
                    project.id,
                    {
                        name: 'myconnector2',
                        credentialId: credential2.id,
                        proxiesMax: 2,
                        proxiesTimeoutDisconnected: PROXY_TIMEOUT_DISCONNECTED_DEFAULT_TEST,
                        proxiesTimeoutUnreachable: {
                            enabled: true,
                            value: PROXY_TIMEOUT_UNREACHABLE_DEFAULT,
                        },
                        config: connectorConfig,
                        certificateDurationInMs: 10 * ONE_MINUTE_IN_MS,
                    }
                );

                await commanderApp.frontendClient.installConnector(
                    project.id,
                    connector2.id,
                    {
                        config: {},
                    }
                );

                await waitFor(async() => {
                    const connectorFound = await commanderApp.frontendClient.getConnectorById(
                        project.id,
                        connector2.id
                    );
                    const config = connectorFound.config as IConnectorDatacenterLocalConfig;
                    expect(config.imageId?.length)
                        .toBeGreaterThan(0);
                });

                await commanderApp.frontendClient.activateConnector(
                    project.id,
                    connector2.id,
                    true
                );

                await waitFor(() => {
                    expect(client.proxiesOnlineCount)
                        .toBe(4);
                });

                const views = await commanderApp.frontendClient.getAllProjectConnectorsAndProxiesById(project.id);
                expect(countProxiesOnlineViews(views))
                    .toBe(4);
            },
            1000 * 20
        );

        it(
            'should scale down to 0 proxy for the first connector',
            async() => {
                await commanderApp.frontendClient.scaleConnector(
                    project.id,
                    connector.id,
                    0
                );

                expect(connector.proxiesMax)
                    .toBe(0);

                await waitFor(() => {
                    expect(client.proxiesCount)
                        .toBe(2);

                    expect(client.views[ 0 ].connector.error)
                        .toBeNull();
                });

                const views = await commanderApp.frontendClient.getAllProjectConnectorsAndProxiesById(project.id);
                expect(countProxiesViews(views))
                    .toBe(2);

                expect(views[ 0 ].connector.error)
                    .toBeNull();
            }
        );
    }
);
