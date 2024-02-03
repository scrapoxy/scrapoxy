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
    EEventScope,
    EProjectStatus,
    EventsConnectorsClient,
    EventsProjectClient,
    ONE_MINUTE_IN_MS,
    ONE_SECOND_IN_MS,
    PROXY_TIMEOUT_DISCONNECTED_DEFAULT_TEST,
    randomName,
    sleep,
} from '@scrapoxy/common';
import axios from 'axios';
import { v4 as uuid } from 'uuid';
import type {
    IConnectorDatacenterLocalConfig,
    IConnectorDatacenterLocalCredential,
} from '@scrapoxy/backend-sdk';
import type {
    ICommanderFrontendClient,
    ICredentialView,
    IProjectData,
    IProjectToCreate,
    ISubscriptionDatacenterLocalToCreate,
} from '@scrapoxy/common';
import type { RawAxiosRequestHeaders } from 'axios';


async function moveToStatus(
    commander: ICommanderFrontendClient,
    clientProject: EventsProjectClient,
    clientConnectors: EventsConnectorsClient,
    projectId: string,
    status: EProjectStatus,
    proxiesMax: number
) {
    await commander.setProjectStatus(
        projectId,
        status
    );

    await waitFor(() => {
        expect(clientProject.project?.status)
            .toBe(status);
    });

    const project = await commander.getProjectById(projectId);

    expect(project.status)
        .toBe(status);

    await waitFor(() => {
        expect(clientConnectors.proxiesOnlineCount)
            .toBe(proxiesMax);
    });
}

describe(
    'Commander - Projects - Status',
    () => {
        const logger = new Logger();
        const
            datacenterLocalApp = new DatacenterLocalApp(logger),
            instance = axios.create({
                validateStatus: () => true,
            }),
            projectToCreate: IProjectToCreate = {
                name: 'myproject',
                autoRotate: true,
                autoRotateDelayRange: {
                    min: ONE_MINUTE_IN_MS * 30,
                    max: ONE_MINUTE_IN_MS * 30,
                },
                autoScaleUp: false,
                autoScaleDown: false,
                autoScaleDownDelay: ONE_SECOND_IN_MS * 30,
                cookieSession: true,
                mitm: true,
                proxiesMin: 1,
                useragentOverride: false,
            },
            servers = new TestServers();
        let
            clientConnectors: EventsConnectorsClient,
            clientProject: EventsProjectClient,

            commanderApp: CommanderApp,
            credentials: ICredentialView[],
            masterApp: MasterApp,
            project: IProjectData,
            token: string;

        beforeAll(async() => {
            // Start target & local connector
            await Promise.all([
                servers.listen(), datacenterLocalApp.start(),
            ]);

            const subscriptions: ISubscriptionDatacenterLocalToCreate[] = [
                {
                    id: uuid(),
                    ...SUBSCRIPTION_LOCAL_DEFAULTS,
                },
                {
                    id: uuid(),
                    ...SUBSCRIPTION_LOCAL_DEFAULTS,
                },
            ];
            const promisesSubscriptions = subscriptions.map((s) => datacenterLocalApp.client.createSubscription(s));
            await Promise.all(promisesSubscriptions);

            // Start app
            commanderApp = CommanderApp.defaults({
                datacenterLocalAppUrl: datacenterLocalApp.url,
                fingerprintUrl: servers.urlFingerprint,
                logger,
            });
            await commanderApp.start();

            clientProject = new EventsProjectClient(commanderApp.events);
            clientConnectors = new EventsConnectorsClient(commanderApp.events);

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
            const credentialConfigs: IConnectorDatacenterLocalCredential[] = subscriptions.map((s) => ({
                subscriptionId: s.id,
            }));
            const promisesCredentials = credentialConfigs.map((cfg) => commanderApp.frontendClient.createCredential(
                project.id,
                {
                    name: randomName(),
                    type: CONNECTOR_DATACENTER_LOCAL_TYPE,
                    config: cfg,
                }
            ));
            credentials = await Promise.all(promisesCredentials);

            await waitFor(async() => {
                const promises = credentials.map((c) => commanderApp.frontendClient.getCredentialById(
                    project.id,
                    c.id
                ));

                await Promise.all(promises);
            });

            await waitFor(async() => {
                token = await commanderApp.frontendClient.getProjectTokenById(project.id);
            });

            // Connect events
            await commanderApp.events.registerAsync({
                scope: EEventScope.PROJECT,
                projectId: project.id,
            });
            await Promise.all([
                clientProject.subscribeAsync(project),
                clientConnectors.subscribeAsync(
                    project.id,
                    []
                ),
            ]);
        });

        afterAll(async() => {
            // Disconnect events
            await Promise.all([
                clientConnectors.unsubscribeAsync(), clientProject.unsubscribeAsync(),
            ]);

            await commanderApp.stop();

            await Promise.all([
                masterApp.stop(), datacenterLocalApp.close(), servers.close(),
            ]);
        });

        it(
            'should create, install and activate 2 connectors and 2 proxies by connector',
            async() => {
                const connectorConfigs: IConnectorDatacenterLocalConfig[] = [
                    {
                        region: 'europe',
                        size: 'small',
                        imageId: void 0,
                    },
                    {
                        region: 'asia',
                        size: 'large',
                        imageId: void 0,
                    },
                ];
                const promises = connectorConfigs.map(async(
                    cfg, i
                ) => {
                    const connector = await commanderApp.frontendClient.createConnector(
                        project.id,
                        {
                            name: randomName(),
                            credentialId: credentials[ i ].id,
                            proxiesMax: 2,
                            proxiesTimeoutDisconnected: PROXY_TIMEOUT_DISCONNECTED_DEFAULT_TEST,
                            config: cfg,
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

                await Promise.all(promises);

                await waitFor(() => {
                    expect(clientConnectors.proxiesOnlineCount)
                        .toBe(4);
                });
            }
        );

        it(
            'should have a HOT project',
            async() => {
                await waitFor(() => {
                    expect(clientProject.project?.status)
                        .toBe(EProjectStatus.HOT);
                });

                project = await commanderApp.frontendClient.getProjectById(project.id);

                expect(project.status)
                    .toBe(EProjectStatus.HOT);
            }
        );

        it(
            'should move HOT -> CALM',
            async() => {
                await moveToStatus(
                    commanderApp.frontendClient,
                    clientProject,
                    clientConnectors,
                    project.id,
                    EProjectStatus.CALM,
                    1
                );
            }
        );

        it(
            'should move CALM -> OFF',
            async() => {
                await moveToStatus(
                    commanderApp.frontendClient,
                    clientProject,
                    clientConnectors,
                    project.id,
                    EProjectStatus.OFF,
                    0
                );
            }
        );

        it(
            'should move OFF -> HOT',
            async() => {
                await moveToStatus(
                    commanderApp.frontendClient,
                    clientProject,
                    clientConnectors,
                    project.id,
                    EProjectStatus.HOT,
                    4
                );
            }
        );

        it(
            'should move HOT -> OFF',
            async() => {
                await moveToStatus(
                    commanderApp.frontendClient,
                    clientProject,
                    clientConnectors,
                    project.id,
                    EProjectStatus.OFF,
                    0
                );
            }
        );

        it(
            'should move OFF -> CALM',
            async() => {
                await moveToStatus(
                    commanderApp.frontendClient,
                    clientProject,
                    clientConnectors,
                    project.id,
                    EProjectStatus.CALM,
                    1
                );
            }
        );

        it(
            'should move CALM -> HOT',
            async() => {
                await moveToStatus(
                    commanderApp.frontendClient,
                    clientProject,
                    clientConnectors,
                    project.id,
                    EProjectStatus.HOT,
                    4
                );
            }
        );

        it(
            'should move HOT -> CALM',
            async() => {
                await moveToStatus(
                    commanderApp.frontendClient,
                    clientProject,
                    clientConnectors,
                    project.id,
                    EProjectStatus.CALM,
                    1
                );
            }
        );

        it(
            'should make a request and keep the project status CALM (autoScaleUp is OFF)',
            async() => {
                const headers: RawAxiosRequestHeaders = {
                    'Proxy-Authorization': `Basic ${token}`,
                };
                const res = await instance.get(
                    `${servers.urlHttps}/mirror/headers`,
                    {
                        headers,
                        proxy: {
                            host: 'localhost',
                            port: masterApp.masterPort,
                            protocol: 'http',
                        },
                    }
                );

                expect(res.status)
                    .toBe(200);

                await sleep(2 * ONE_SECOND_IN_MS);

                const projectFound = await commanderApp.frontendClient.getProjectById(project.id);
                expect(projectFound.status)
                    .toBe(EProjectStatus.CALM);

                await waitFor(async() => {
                    expect(clientConnectors.proxiesOnlineCount)
                        .toBe(1);
                });
            }
        );

        it(
            'should update autoScaleUp settings to ON',
            async() => {
                await commanderApp.frontendClient.updateProject(
                    project.id,
                    {
                        ...projectToCreate,
                        autoScaleUp: true,
                    }
                );

                await waitFor(async() => {
                    const projectFound = await commanderApp.frontendClient.getProjectById(project.id);
                    expect(projectFound.autoScaleUp)
                        .toBeTruthy();
                });
            }
        );

        it(
            'should make a request and move the project status to HOT (autoScaleUp is ON)',
            async() => {
                const headers: RawAxiosRequestHeaders = {
                    'Proxy-Authorization': `Basic ${token}`,
                };
                const res = await instance.get(
                    `${servers.urlHttps}/mirror/headers`,
                    {
                        headers,
                        proxy: {
                            host: 'localhost',
                            port: masterApp.masterPort,
                            protocol: 'http',
                        },
                    }
                );

                expect(res.status)
                    .toBe(200);

                await sleep(2 * ONE_SECOND_IN_MS);

                const projectFound = await commanderApp.frontendClient.getProjectById(project.id);
                expect(projectFound.status)
                    .toBe(EProjectStatus.HOT);

                await waitFor(async() => {
                    expect(clientConnectors.proxiesOnlineCount)
                        .toBe(4);
                });
            }
        );

        it(
            'should not make any request, wait and keep the project status to HOT (autoScaleDown is OFF)',
            async() => {
                await sleep(ONE_SECOND_IN_MS * 40);

                const projectFound = await commanderApp.frontendClient.getProjectById(project.id);
                expect(projectFound.status)
                    .toBe(EProjectStatus.HOT);

                await waitFor(async() => {
                    expect(clientConnectors.proxiesOnlineCount)
                        .toBe(4);
                });
            },
            ONE_MINUTE_IN_MS
        );

        it(
            'should update autoScaleDown settings to ON',
            async() => {
                await commanderApp.frontendClient.updateProject(
                    project.id,
                    {
                        ...projectToCreate,
                        autoScaleDown: true,
                    }
                );

                await waitFor(async() => {
                    const projectFound = await commanderApp.frontendClient.getProjectById(project.id);
                    expect(projectFound.autoScaleDown)
                        .toBeTruthy();
                });
            }
        );

        it(
            'should not make any request, wait and move the project status to CALM (autoScaleDown is ON)',
            async() => {
                await waitFor(async() => {
                    const projectFound = await commanderApp.frontendClient.getProjectById(project.id);
                    expect(projectFound.status)
                        .toBe(EProjectStatus.CALM);

                    expect(clientConnectors.proxiesOnlineCount)
                        .toBe(1);
                });
            }
        );

        it(
            'should update proxiesMin settings to 2',
            async() => {
                await commanderApp.frontendClient.updateProject(
                    project.id,
                    {
                        ...projectToCreate,
                        proxiesMin: 2,
                    }
                );

                await waitFor(async() => {
                    const projectFound = await commanderApp.frontendClient.getProjectById(project.id);
                    expect(projectFound.proxiesMin)
                        .toBe(2);
                });
            }
        );

        it(
            'should have 2 proxies for CALM',
            async() => {
                await moveToStatus(
                    commanderApp.frontendClient,
                    clientProject,
                    clientConnectors,
                    project.id,
                    EProjectStatus.CALM,
                    2
                );
            }
        );
    }
);
