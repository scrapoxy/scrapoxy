import { Logger } from '@nestjs/common';
import {
    ConnectorUpdateError,
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
} from '@scrapoxy/common';


describe(
    'Commander - Connectors - Activate',
    () => {
        const
            logger = new Logger();
        const
            datacenterLocalApp = new DatacenterLocalApp(logger),
            servers = new TestServers();
        let
            client: EventsConnectorsClient,
            commanderApp: CommanderApp,
            connector: IConnectorView,
            credential: ICredentialView,
            masterApp: MasterApp,
            project: IProjectData;

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
                autoScaleDown: {
                    enabled: true,
                    value: ONE_MINUTE_IN_MS,
                },
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

            await waitFor(async() => {
                await commanderApp.frontendClient.getCredentialById(
                    project.id,
                    credential.id
                );
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
            'should create an inactive connector',
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

                await waitFor(() => {
                    expect(client.views[ 0 ].connector.active)
                        .toBeFalsy();
                });

                connector = await commanderApp.frontendClient.getConnectorById(
                    project.id,
                    connector.id
                );
                expect(connector.active)
                    .toBeFalsy();
            }
        );

        it(
            'should install the connector',
            async() => {
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
            }
        );

        it(
            'should activate the connector',
            async() => {
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
            'should not activate the connector again',
            async() => {
                await expect(commanderApp.frontendClient.activateConnector(
                    project.id,
                    connector.id,
                    true
                ))
                    .rejects
                    .toThrowError(ConnectorUpdateError);
            }
        );

        it(
            'should scale the connector with 1 proxy',
            async() => {
                await commanderApp.frontendClient.scaleConnector(
                    project.id,
                    connector.id,
                    1
                );

                connector = await commanderApp.frontendClient.getConnectorById(
                    project.id,
                    connector.id
                );
                expect(connector.proxiesMax)
                    .toBe(1);
            }
        );

        it(
            'should deactivate the connector',
            async() => {
                await commanderApp.frontendClient.activateConnector(
                    project.id,
                    connector.id,
                    false
                );

                await waitFor(() => {
                    expect(client.views[ 0 ].connector.active)
                        .toBeFalsy();

                    expect(client.proxiesCount)
                        .toBe(0);
                });

                const view = await commanderApp.frontendClient.getAllConnectorProxiesById(
                    project.id,
                    connector.id
                );
                expect(view.connector.active)
                    .toBeFalsy();

                expect(view.proxies)
                    .toHaveLength(0);
            }
        );

        it(
            'should not deactivate the connector again',
            async() => {
                await expect(commanderApp.frontendClient.activateConnector(
                    project.id,
                    connector.id,
                    false
                ))
                    .rejects
                    .toThrowError(ConnectorUpdateError);
            }
        );
    }
);
