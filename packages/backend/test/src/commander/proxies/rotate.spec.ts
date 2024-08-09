import { Logger } from '@nestjs/common';
import {
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
    ONE_MINUTE_IN_MS,
    ONE_SECOND_IN_MS,
    PROXY_TIMEOUT_DISCONNECTED_DEFAULT_TEST,
    PROXY_TIMEOUT_UNREACHABLE_DEFAULT,
    sleep,
} from '@scrapoxy/common';
import { v4 as uuid } from 'uuid';
import type {
    IConnectorDatacenterLocalConfig,
    IConnectorDatacenterLocalCredential,
} from '@scrapoxy/backend-connectors';
import type {
    IConnectorView,
    ICredentialView,
    IProjectData,
    IProjectToCreate,
} from '@scrapoxy/common';


describe(
    'Commander - Proxies - Auto Rotate',
    () => {
        const logger = new Logger();
        const
            datacenterLocalApp = new DatacenterLocalApp(logger),
            projectToCreate: IProjectToCreate = {
                name: 'myproject',
                autoRotate: {
                    enabled: false,
                    min: ONE_SECOND_IN_MS * 30,
                    max: ONE_SECOND_IN_MS * 30,
                },
                autoScaleUp: false,
                autoScaleDown: {
                    enabled: false,
                    value: ONE_SECOND_IN_MS * 30,
                },
                cookieSession: true,
                mitm: true,
                proxiesMin: 1,
                useragentOverride: false,
                ciphersShuffle: false,
            },
            servers = new TestServers();
        let
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
                    proxiesMax: 1,
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
        });

        afterAll(async() => {
            await commanderApp.stop();

            await Promise.all([
                masterApp.stop(), datacenterLocalApp.close(), servers.close(),
            ]);
        });

        let proxyId: string;
        it(
            'should have a proxy',
            async() => {
                await waitFor(async() => {
                    const view = await commanderApp.frontendClient.getAllConnectorProxiesById(
                        project.id,
                        connector.id
                    );
                    expect(view.proxies)
                        .toHaveLength(connector.proxiesMax);

                    proxyId = view.proxies[ 0 ].id;
                });
            }
        );

        it(
            'should wait 40 seconds and have the same proxy',
            async() => {
                await sleep(ONE_SECOND_IN_MS * 40);

                await waitFor(async() => {
                    const view = await commanderApp.frontendClient.getAllConnectorProxiesById(
                        project.id,
                        connector.id
                    );
                    expect(view.proxies)
                        .toHaveLength(connector.proxiesMax);

                    expect(view.proxies[ 0 ].id)
                        .toBe(proxyId);
                });
            },
            ONE_MINUTE_IN_MS
        );

        it(
            'should update autoRotate settings to ON',
            async() => {
                await commanderApp.frontendClient.updateProject(
                    project.id,
                    {
                        ...projectToCreate,
                        autoRotate: {
                            ...projectToCreate.autoRotate,
                            enabled: true,
                        },
                    }
                );

                await waitFor(async() => {
                    const projectFound = await commanderApp.frontendClient.getProjectById(project.id);
                    expect(projectFound.autoRotate)
                        .toBeTruthy();
                });
            }
        );

        it(
            'should have another proxy',
            async() => {
                await waitFor(async() => {
                    const view = await commanderApp.frontendClient.getAllConnectorProxiesById(
                        project.id,
                        connector.id
                    );
                    expect(view.proxies)
                        .toHaveLength(connector.proxiesMax);

                    expect(view.proxies[ 0 ].id).not.toBe(proxyId);
                });
            },
            ONE_MINUTE_IN_MS
        );
    }
);
