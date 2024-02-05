import { Logger } from '@nestjs/common';
import {
    DatacenterLocalApp,
    ProjectNameAlreadyExistsError,
    ProjectRemoveError,
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
    ECommanderError,
    EEventScope,
    EProjectStatus,
    EventsProjectClient,
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
    IProjectData,
    IProjectToCreate,
    IProjectToUpdate,
} from '@scrapoxy/common';


describe(
    'Commander - Projects',
    () => {
        const logger = new Logger();
        const
            datacenterLocalApp = new DatacenterLocalApp(logger),
            projectToCreate: IProjectToCreate = {
                name: 'new project 2',
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
            projectToCreate2: IProjectToCreate = {
                name: 'new project 1', // Check sort on name
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
            projectToUpdate: IProjectToUpdate = {
                name: 'new name for project',
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
            subscriptionId = uuid();
        let
            client: EventsProjectClient,
            commanderApp: CommanderApp,
            connector: IConnectorView,
            masterApp: MasterApp,
            project: IProjectData,
            project2: IProjectData,
            projectRemoved = false;

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
        });

        afterAll(async() => {
            await commanderApp.stop();

            await Promise.all([
                masterApp.stop(), datacenterLocalApp.close(), servers.close(),
            ]);
        });

        it(
            'should not have project',
            async() => {
                const projects = await commanderApp.frontendClient.getAllProjectsForUserId();

                expect(projects)
                    .toHaveLength(0);
            }
        );

        it(
            'should not create unnamed project',
            async() => {
                const create: any = {
                    name: void 0,
                };

                await expect(commanderApp.frontendClient.createProject(create))
                    .rejects
                    .toThrowError(ValidationError);
            }
        );

        it(
            'should not register event to an unknown project',
            async() => {
                const projectRegister: IProjectData = {
                    id: uuid(),
                    name: 'fake_project',
                    status: EProjectStatus.HOT,
                    connectorDefaultId: null,
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
                };
                const clientRegister = new EventsProjectClient(commanderApp.events);
                await commanderApp.events.registerAsync({
                    scope: EEventScope.PROJECT,
                    projectId: projectRegister.id,
                });
                await clientRegister.subscribeAsync(projectRegister);

                await waitFor(() => {
                    expect(commanderApp.events.popError().id)
                        .toBe(ECommanderError.ProjectInaccessible);
                });
            }
        );

        it(
            'should create a first project with a connector',
            async() => {
                project = await commanderApp.frontendClient.createProject(projectToCreate);

                const credentialConfig: IConnectorDatacenterLocalCredential = {
                    subscriptionId,
                };
                const credential = await commanderApp.frontendClient.createCredential(
                    project.id,
                    {
                        name: 'mycredential',
                        type: CONNECTOR_DATACENTER_LOCAL_TYPE,
                        config: credentialConfig,
                    }
                );

                expect(project.name)
                    .toBe(projectToCreate.name);

                expect(project.mitm)
                    .toBe(projectToCreate.mitm);

                await waitFor(async() => {
                    const projects = await commanderApp.frontendClient.getAllProjectsForUserId();
                    expect(projects)
                        .toHaveLength(1);

                    const projectFound = await commanderApp.frontendClient.getProjectById(project.id);
                    expect(projectFound.name)
                        .toEqual(projectToCreate.name);

                    expect(projectFound.mitm)
                        .toEqual(projectToCreate.mitm);
                });

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
            }
        );

        it(
            'should not create a project with a existing name',
            async() => {
                await expect(commanderApp.frontendClient.createProject(projectToCreate))
                    .rejects
                    .toThrowError(ProjectNameAlreadyExistsError);
            }
        );

        it(
            'should register event to this first project',
            async() => {
                client = new EventsProjectClient(
                    commanderApp.events,
                    () => {
                        projectRemoved = true;
                    }
                );
                await commanderApp.events.registerAsync({
                    scope: EEventScope.PROJECT,
                    projectId: project.id,
                });
                await client.subscribeAsync(project);
            }
        );

        it(
            'should not update project to noname',
            async() => {
                const projectUpdate: any = {
                    name: void 0,
                };

                await expect(commanderApp.frontendClient.updateProject(
                    project.id,
                    projectUpdate
                ))
                    .rejects
                    .toThrowError(ValidationError);
            }
        );

        it(
            'should update the project',
            async() => {
                project = await commanderApp.frontendClient.updateProject(
                    project.id,
                    projectToUpdate
                );

                expect(project.name)
                    .toBe(projectToUpdate.name);

                expect(project.mitm)
                    .toBe(projectToUpdate.mitm);

                await waitFor(() => {
                    expect(client.project?.name)
                        .toBe(projectToUpdate.name);

                    expect(client.project?.mitm)
                        .toBe(projectToUpdate.mitm);
                });

                const projectFound = await commanderApp.frontendClient.getProjectById(project.id);

                expect(projectFound.name)
                    .toBe(projectToUpdate.name);

                expect(projectFound.mitm)
                    .toBe(projectToUpdate.mitm);
            }
        );

        it(
            'should create a second project',
            async() => {
                project2 = await commanderApp.frontendClient.createProject(projectToCreate2);

                expect(project2.name)
                    .toBe(projectToCreate2.name);

                expect(project2.mitm)
                    .toBe(projectToCreate2.mitm);

                await waitFor(async() => {
                    const projects = await commanderApp.frontendClient.getAllProjectsForUserId();
                    expect(projects)
                        .toHaveLength(2);

                    const projectFound = await commanderApp.frontendClient.getProjectById(project2.id);

                    expect(projectFound.name)
                        .toEqual(project2.name);

                    expect(projectFound.mitm)
                        .toEqual(project2.mitm);
                });
            }
        );

        it(
            'should not update the second project with the name of the first project',
            async() => {
                await expect(commanderApp.frontendClient.updateProject(
                    project2.id,
                    projectToUpdate
                ))
                    .rejects
                    .toThrowError(ProjectNameAlreadyExistsError);
            }
        );

        it(
            'should not remove the first active project',
            async() => {
                await expect(commanderApp.frontendClient.removeProject(project.id))
                    .rejects
                    .toThrowError(ProjectRemoveError);
            }
        );

        it(
            'should turn off the first active project',
            async() => {
                await commanderApp.frontendClient.setProjectStatus(
                    project.id,
                    EProjectStatus.OFF
                );
            }
        );

        it(
            'should not remove a project with connectors',
            async() => {
                await expect(commanderApp.frontendClient.removeProject(project.id))
                    .rejects
                    .toThrowError(ProjectRemoveError);
            }
        );

        it(
            'should remove the connector of the first project',
            async() => {
                await commanderApp.frontendClient.removeConnector(
                    project.id,
                    connector.id
                );
            }
        );

        it(
            'should remove the first project',
            async() => {
                await commanderApp.frontendClient.removeProject(project.id);

                await waitFor(() => {
                    expect(projectRemoved)
                        .toBeTruthy();
                });

                const projects = await commanderApp.frontendClient.getAllProjectsForUserId();
                expect(projects)
                    .toHaveLength(1);
            }
        );

        it(
            'should turn off and remove the second project',
            async() => {
                await commanderApp.frontendClient.setProjectStatus(
                    project2.id,
                    EProjectStatus.OFF
                );

                await commanderApp.frontendClient.removeProject(project2.id);

                await waitFor(async() => {
                    const projects = await commanderApp.frontendClient.getAllProjectsForUserId();
                    expect(projects)
                        .toHaveLength(0);
                });
            }
        );
    }
);
