import { Logger } from '@nestjs/common';
import { ConnectorUpdateError } from '@scrapoxy/backend-sdk';
import {
    CommanderApp,
    MasterApp,
    TestServers,
    waitFor,
} from '@scrapoxy/backend-test-sdk';
import {
    CloudlocalApp,
    SUBSCRIPTION_LOCAL_DEFAULTS,
} from '@scrapoxy/cloudlocal';
import {
    EEventScope,
    EventsConnectorsClient,
    ONE_MINUTE_IN_MS,
} from '@scrapoxy/common';
import { CONNECTOR_CLOUDLOCAL_TYPE } from '@scrapoxy/connector-cloudlocal-sdk';
import { v4 as uuid } from 'uuid';
import type {
    IConnectorView,
    ICredentialView,
    IProjectData,
} from '@scrapoxy/common';
import type {
    IConnectorCloudlocalConfig,
    IConnectorCloudlocalCredential,
} from '@scrapoxy/connector-cloudlocal-backend';


describe(
    'Commander - Connectors - Activate',
    () => {
        const
            logger = new Logger();
        const
            cloudlocalApp = new CloudlocalApp(logger),
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
                servers.listen(), cloudlocalApp.start(),
            ]);

            const subscriptionId = uuid();
            await cloudlocalApp.client.createSubscription({
                id: subscriptionId,
                ...SUBSCRIPTION_LOCAL_DEFAULTS,
            });

            // Start app
            commanderApp = CommanderApp.defaults({
                cloudlocalAppUrl: cloudlocalApp.url,
                fingerprintUrl: servers.urlFingerprint,
                logger,
            });
            await commanderApp.start();

            client = new EventsConnectorsClient(commanderApp.events);

            masterApp = MasterApp.defaults({
                cloudlocalAppUrl: cloudlocalApp.url,
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
            const credentialConfig: IConnectorCloudlocalCredential = {
                subscriptionId,
            };

            credential = await commanderApp.frontendClient.createCredential(
                project.id,
                {
                    name: 'mycredential',
                    type: CONNECTOR_CLOUDLOCAL_TYPE,
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
                masterApp.stop(), cloudlocalApp.close(), servers.close(),
            ]);
        });

        it(
            'should create an inactive connector',
            async() => {
                const connectorConfig: IConnectorCloudlocalConfig = {
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
                    const connectorConfigFound = connectorFound.config as IConnectorCloudlocalConfig;
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
