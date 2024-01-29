import { Logger } from '@nestjs/common';
import {
    CredentialInvalidError,
    CredentialNameAlreadyExistsError,
    CredentialNotFoundError,
    CredentialRemoveError,
    CredentialUpdateError,
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
    EEventScope,
    EventsConnectorsClient,
    EventsCredentialsClient,
    ONE_MINUTE_IN_MS,
} from '@scrapoxy/common';
import { v4 as uuid } from 'uuid';
import type {
    IConnectorDatacenterLocalConfig,
    IConnectorDatacenterLocalCredential,
} from '@scrapoxy/backend-sdk';
import type {
    IConnectorToCreate,
    IConnectorToUpdate,
    IConnectorView,
    ICredentialToCreate,
    ICredentialToUpdate,
    ICredentialView,
    IProjectData,
} from '@scrapoxy/common';


describe(
    'Commander - Credentials',
    () => {
        const logger = new Logger();
        const
            datacenterLocalApp = new DatacenterLocalApp(logger),
            servers = new TestServers(),
            subscriptionId = uuid(),
            subscriptionId2 = uuid();
        const
            credentialConfig: IConnectorDatacenterLocalCredential = {
                subscriptionId: subscriptionId,
            },
            credentialConfig2: IConnectorDatacenterLocalCredential = {
                subscriptionId: subscriptionId2,
            };
        const
            credentials: ICredentialView[] = [],
            credentialsToCreate: ICredentialToCreate[] = [
                {
                    name: 'mycredential1',
                    type: CONNECTOR_DATACENTER_LOCAL_TYPE,
                    config: credentialConfig,
                },
                {
                    name: 'mycredential2',
                    type: CONNECTOR_DATACENTER_LOCAL_TYPE,
                    config: credentialConfig2,
                },
            ];
        const credentialToUpdate: ICredentialToUpdate = {
            name: 'another credential name',
            config: credentialsToCreate[ 0 ].config,
        };
        let
            clientConnectors: EventsConnectorsClient,
            clientCredentials: EventsCredentialsClient,
            commanderApp: CommanderApp,
            connector: IConnectorView,
            connectorToCreate: IConnectorToCreate,
            masterApp: MasterApp,
            project: IProjectData;

        beforeAll(async() => {
            // Start target & local connector
            await Promise.all([
                servers.listen(), datacenterLocalApp.start(),
            ]);

            await datacenterLocalApp.client.createSubscription({
                id: subscriptionId,
                ...SUBSCRIPTION_LOCAL_DEFAULTS,
            });

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

            clientCredentials = new EventsCredentialsClient(commanderApp.events);
            clientConnectors = new EventsConnectorsClient(commanderApp.events);

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

            // Connect events

            clientCredentials.subscribe(
                project.id,
                []
            );

            await Promise.all([
                commanderApp.events.registerAsync({
                    scope: EEventScope.PROJECT,
                    projectId: project.id,
                }),
                clientConnectors.subscribeAsync(
                    project.id,
                    []
                ),
            ]);
        });

        afterAll(async() => {
            clientCredentials.unsubscribe();

            await clientConnectors.unsubscribeAsync();

            await commanderApp.stop();

            await Promise.all([
                masterApp.stop(), datacenterLocalApp.close(), servers.close(),
            ]);
        });

        it(
            'should not have any credential',
            async() => {
                const credentialsFound = await commanderApp.frontendClient.getAllProjectCredentials(
                    project.id,
                    null
                );
                expect(credentialsFound)
                    .toHaveLength(0);
            }
        );

        it(
            'should not create unnamed credential',
            async() => {
                const create: any = {
                    name: void 0,
                    type: CONNECTOR_DATACENTER_LOCAL_TYPE,
                };

                await expect(commanderApp.frontendClient.createCredential(
                    project.id,
                    create
                ))
                    .rejects
                    .toThrowError(ValidationError);
            }
        );

        it(
            'should not create credential with empty token',
            async() => {
                const create: ICredentialToCreate = {
                    name: 'empty token',
                    type: CONNECTOR_DATACENTER_LOCAL_TYPE,
                    config: {},
                };

                await expect(commanderApp.frontendClient.createCredential(
                    project.id,
                    create
                ))
                    .rejects
                    .toThrowError(ValidationError);
            }
        );

        it(
            'should not create credential with invalid token',
            async() => {
                const create: ICredentialToCreate = {
                    name: 'invalid token',
                    type: CONNECTOR_DATACENTER_LOCAL_TYPE,
                    config: {
                        subscriptionId: uuid(),
                    },
                };

                await expect(commanderApp.frontendClient.createCredential(
                    project.id,
                    create
                ))
                    .rejects
                    .toThrowError(CredentialInvalidError);
            }
        );

        it(
            'should create 2 credentials',
            async() => {
                for (const credentialToCreate of credentialsToCreate) {
                    const credential = await commanderApp.frontendClient.createCredential(
                        project.id,
                        credentialToCreate
                    );

                    expect(credential.name)
                        .toBe(credentialToCreate.name);
                    expect(credential.type)
                        .toBe(credentialToCreate.type);

                    credentials.push(credential);
                }

                await waitFor(() => {
                    expect(clientCredentials.credentials)
                        .toHaveLength(2);

                    for (let i = 0; i < clientCredentials.credentials.length; ++i) {
                        const
                            clientCredential = clientCredentials.credentials[ i ],
                            credentialToCreate = credentialsToCreate[ i ];

                        expect(clientCredential.name)
                            .toBe(credentialToCreate.name);
                        expect(clientCredential.type)
                            .toBe(credentialToCreate.type);
                    }
                });

                const credentialsFound = await commanderApp.frontendClient.getAllProjectCredentials(
                    project.id,
                    null
                );
                expect(credentialsFound)
                    .toHaveLength(2);

                for (let i = 0; i < credentialsFound.length; ++i) {
                    const
                        credentialFound = credentialsFound[ i ],
                        credentialToCreate = credentialsToCreate[ i ];

                    expect(credentialFound.name)
                        .toBe(credentialToCreate.name);
                    expect(credentialFound.type)
                        .toBe(credentialToCreate.type);

                    const credentialFound2 = await commanderApp.frontendClient.getCredentialById(
                        project.id,
                        credentialFound.id
                    );
                    expect(credentialFound2.name)
                        .toBe(credentialToCreate.name);
                    expect(credentialFound2.type)
                        .toBe(credentialToCreate.type);
                    expect(credentialFound2.config)
                        .toEqual(credentialToCreate.config);
                }

                const connectorConfig: IConnectorDatacenterLocalConfig = {
                    region: 'europe',
                    size: 'small',
                    imageId: void 0,
                };

                connectorToCreate = {
                    name: 'myconnector',
                    proxiesMax: 0,
                    credentialId: credentials[ 0 ].id,
                    config: connectorConfig,
                    certificateDurationInMs: 10 * ONE_MINUTE_IN_MS,
                };
            }
        );

        it(
            'should get all credentials of one type',
            async() => {
                const credentialsFound = await commanderApp.frontendClient.getAllProjectCredentials(
                    project.id,
                    'datacenter-local'
                );
                expect(credentialsFound)
                    .toHaveLength(2);
            }
        );

        it(
            'should not create a credential with a existing name',
            async() => {
                await expect(commanderApp.frontendClient.createCredential(
                    project.id,
                    credentialsToCreate[ 0 ]
                ))
                    .rejects
                    .toThrowError(CredentialNameAlreadyExistsError);
            }
        );

        it(
            'should add and install an inactive connector attached to the first credential',
            async() => {
                connector = await commanderApp.frontendClient.createConnector(
                    project.id,
                    connectorToCreate
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

                    expect(clientConnectors.views)
                        .toHaveLength(1);
                });
            }
        );

        it(
            'should not update credential to noname',
            async() => {
                const update: any = {
                    name: void 0,
                    config: {
                        subscriptionId: uuid(),
                    },
                };

                await expect(commanderApp.frontendClient.updateCredential(
                    project.id,
                    credentials[ 0 ].id,
                    update
                ))
                    .rejects
                    .toThrowError(ValidationError);
            }
        );

        it(
            'should not update credential with invalid token',
            async() => {
                const update: ICredentialToUpdate = {
                    name: credentialsToCreate[ 0 ].name,
                    config: {
                        subscriptionId: uuid(),
                    },
                };

                await expect(commanderApp.frontendClient.updateCredential(
                    project.id,
                    credentials[ 0 ].id,
                    update
                ))
                    .rejects
                    .toThrowError(CredentialInvalidError);
            }
        );

        it(
            'should not update the second credential with the name of the first',
            async() => {
                const update: ICredentialToUpdate = {
                    name: credentialsToCreate[ 0 ].name,
                    config: credentialsToCreate[ 0 ].config,
                };
                await expect(commanderApp.frontendClient.updateCredential(
                    project.id,
                    credentials[ 1 ].id,
                    update
                ))
                    .rejects
                    .toThrowError(CredentialNameAlreadyExistsError);
            }
        );

        it(
            'should update and re-install the connector with different credential but same type',
            async() => {
                const update: IConnectorToUpdate = {
                    name: connectorToCreate.name,
                    credentialId: credentials[ 1 ].id,
                    config: connectorToCreate.config,
                };

                connector = await commanderApp.frontendClient.updateConnector(
                    project.id,
                    connector.id,
                    update
                );

                await waitFor(async() => {
                    const connectorFound = await commanderApp.frontendClient.getConnectorById(
                        project.id,
                        connector.id
                    );
                    expect(connectorFound.credentialId)
                        .toBe(credentials[ 1 ].id);
                });

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
            'should not update credential when connector is active',
            async() => {
                // Activate the connector
                await commanderApp.frontendClient.activateConnector(
                    project.id,
                    connector.id,
                    true
                );

                await waitFor(async() => {
                    expect(clientConnectors.views[ 0 ].connector.active)
                        .toBeTruthy();
                });

                await expect(commanderApp.frontendClient.updateCredential(
                    project.id,
                    credentials[ 1 ].id,
                    credentialToUpdate
                ))
                    .rejects
                    .toThrowError(CredentialUpdateError);

                // Deactivate the connector
                await commanderApp.frontendClient.activateConnector(
                    project.id,
                    connector.id,
                    false
                );

                await waitFor(async() => {
                    expect(clientConnectors.views[ 0 ].connector.active)
                        .toBeFalsy();
                });
            }
        );

        it(
            'should update credential when connector is not active',
            async() => {
                await commanderApp.frontendClient.updateCredential(
                    project.id,
                    credentials[ 1 ].id,
                    credentialToUpdate
                );

                await waitFor(async() => {
                    const credential = clientCredentials.credentials.find((c) => c.id === credentials[ 1 ].id);
                    expect(credential?.name)
                        .toBe(credentialToUpdate.name);
                });

                const credentialFound = await commanderApp.frontendClient.getCredentialById(
                    project.id,
                    credentials[ 1 ].id
                );
                expect(credentialFound.name)
                    .toBe(credentialToUpdate.name);
            }
        );

        it(
            'should not remove an unknown credential',
            async() => {
                await expect(commanderApp.frontendClient.removeCredential(
                    project.id,
                    uuid()
                ))
                    .rejects
                    .toThrowError(CredentialNotFoundError);
            }
        );

        it(
            'should not remove a credential with attached connector',
            async() => {
                await expect(commanderApp.frontendClient.removeCredential(
                    project.id,
                    credentials[ 1 ].id
                ))
                    .rejects
                    .toThrowError(CredentialRemoveError);
            }
        );

        it(
            'should remove a credential without attached inactive connector',
            async() => {
                await commanderApp.frontendClient.removeConnector(
                    project.id,
                    connector.id
                );

                await waitFor(() => {
                    expect(clientConnectors.views)
                        .toHaveLength(0);
                });

                await commanderApp.frontendClient.removeCredential(
                    project.id,
                    credentials[ 1 ].id
                );

                await waitFor(async() => {
                    expect(clientCredentials.credentials)
                        .toHaveLength(1);
                });

                const credentialsFound = await commanderApp.frontendClient.getAllProjectCredentials(
                    project.id,
                    null
                );
                expect(credentialsFound)
                    .toHaveLength(1);
            }
        );
    }
);
