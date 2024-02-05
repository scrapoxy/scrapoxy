import { Logger } from '@nestjs/common';
import {
    ConnectorNotFoundError,
    DatacenterLocalApp,
    SUBSCRIPTION_LOCAL_DEFAULTS,
    TaskCancelError,
    TaskCreateError,
    TaskRemoveError,
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
    EventsTasksClient,
    isTaskSucceed,
    ONE_MINUTE_IN_MS,
    PROXY_TIMEOUT_DISCONNECTED_DEFAULT_TEST,
    PROXY_TIMEOUT_UNREACHABLE_DEFAULT,
} from '@scrapoxy/common';
import { v4 as uuid } from 'uuid';
import type {
    IConnectorDatacenterLocalConfig,
    IConnectorDatacenterLocalCredential,
} from '@scrapoxy/backend-connectors';
import type {
    IConnectorToInstall,
    IConnectorView,
    ICredentialView,
    IProjectData,
    ITaskView,
} from '@scrapoxy/common';


describe(
    'Commander - Connectors - Install',
    () => {
        const logger = new Logger();
        const
            datacenterLocalApp = new DatacenterLocalApp(logger),
            servers = new TestServers();
        let
            client: EventsTasksClient,
            commanderApp: CommanderApp,
            connector: IConnectorView,
            connector2: IConnectorView,
            credential: ICredentialView,
            masterApp: MasterApp,
            project: IProjectData,
            task: ITaskView,
            task2: ITaskView;

        beforeAll(async() => {
            // Start target & local connector
            await Promise.all([
                servers.listen(), datacenterLocalApp.start(),
            ]);

            const subscriptionId = uuid();
            await datacenterLocalApp.client.createSubscription({
                id: subscriptionId,
                ...SUBSCRIPTION_LOCAL_DEFAULTS,
                installDelay: 2000,
            });

            // Start app
            commanderApp = CommanderApp.defaults({
                datacenterLocalAppUrl: datacenterLocalApp.url,
                fingerprintUrl: servers.urlFingerprint,
                logger,
            });
            await commanderApp.start();

            client = new EventsTasksClient(commanderApp.events);

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

            // Create 2 connectors
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

            const connectorConfig2: IConnectorDatacenterLocalConfig = {
                region: 'europe',
                size: 'small',
                imageId: void 0,
            };
            connector2 = await commanderApp.frontendClient.createConnector(
                project.id,
                {
                    name: 'myconnector2',
                    proxiesMax: 10,
                    proxiesTimeoutDisconnected: PROXY_TIMEOUT_DISCONNECTED_DEFAULT_TEST,
                    proxiesTimeoutUnreachable: {
                        enabled: true,
                        value: PROXY_TIMEOUT_UNREACHABLE_DEFAULT,
                    },
                    credentialId: credential.id,
                    config: connectorConfig2,
                    certificateDurationInMs: 10 * ONE_MINUTE_IN_MS,
                }
            );

            await waitFor(async() => {
                await Promise.all([
                    commanderApp.frontendClient.getConnectorById(
                        project.id,
                        connector.id
                    ),
                    commanderApp.frontendClient.getConnectorById(
                        project.id,
                        connector2.id
                    ),
                ]);
            });

            // Connect events
            const tasks = await commanderApp.frontendClient.getAllProjectTasksById(project.id);
            client.subscribe(
                project.id,
                tasks
            );

            await commanderApp.events.registerAsync({
                scope: EEventScope.PROJECT,
                projectId: project.id,
            });
        });

        afterAll(async() => {
            // Disconnect events
            client.unsubscribe();

            await commanderApp.stop();

            await Promise.all([
                masterApp.stop(), datacenterLocalApp.close(), servers.close(),
            ]);
        });

        describe(
            'Run 2 successful tasks',
            () => {
                it(
                    'should have no task',
                    async() => {
                        await waitFor(() => {
                            expect(client.tasks)
                                .toHaveLength(0);
                        });

                        const tasks = await commanderApp.frontendClient.getAllProjectTasksById(project.id);
                        expect(tasks)
                            .toHaveLength(0);
                    }
                );

                it(
                    'should not create a task on an unknown connector',
                    async() => {
                        const connectorToInstall: IConnectorToInstall = {
                            config: {},
                        };
                        await expect(commanderApp.frontendClient.installConnector(
                            project.id,
                            uuid(),
                            connectorToInstall
                        ))
                            .rejects
                            .toThrowError(ConnectorNotFoundError);
                    }
                );

                it(
                    'should start an install task on first connector',
                    async() => {
                        const connectorToInstall: IConnectorToInstall = {
                            config: {},
                        };
                        task = await commanderApp.frontendClient.installConnector(
                            project.id,
                            connector.id,
                            connectorToInstall
                        );

                        expect(task.projectId)
                            .toBe(project.id);
                        expect(task.connectorId)
                            .toBe(connector.id);
                        expect(task.type)
                            .toBe('imagecreate::datacenter-local');
                        expect(task.running)
                            .toBeTruthy();
                        expect(task.cancelled)
                            .toBeFalsy();
                        expect(task.stepCurrent)
                            .toBe(0);
                        expect(task.stepMax)
                            .toBe(2);
                        expect(task.endAtTs)
                            .toBeNull();

                        await waitFor(() => {
                            expect(client.tasks)
                                .toHaveLength(1);

                            const taskFound = client.tasks[ 0 ];
                            expect(taskFound.projectId)
                                .toBe(project.id);
                            expect(taskFound.connectorId)
                                .toBe(connector.id);
                            expect(taskFound.type)
                                .toBe('imagecreate::datacenter-local');
                            expect(taskFound.running)
                                .toBeTruthy();
                            expect(taskFound.cancelled)
                                .toBeFalsy();
                            // should be at step 1
                            expect(taskFound.stepCurrent)
                                .toBe(1);
                            expect(taskFound.stepMax)
                                .toBe(2);
                            expect(taskFound.endAtTs)
                                .toBeNull();
                        });
                    }
                );

                it(
                    'should not start a second install task on the same connector',
                    async() => {
                        const connectorToInstall: IConnectorToInstall = {
                            config: {},
                        };
                        await expect(commanderApp.frontendClient.installConnector(
                            project.id,
                            connector.id,
                            connectorToInstall
                        ))
                            .rejects
                            .toThrowError(TaskCreateError);
                    }
                );

                it(
                    'should not remove a running task',
                    async() => {
                        await expect(commanderApp.frontendClient.removeTask(
                            project.id,
                            task.id
                        ))
                            .rejects
                            .toThrowError(TaskRemoveError);
                    }
                );

                it(
                    'should start an install task on second connector',
                    async() => {
                        const connectorToInstall: IConnectorToInstall = {
                            config: {},
                        };
                        task2 = await commanderApp.frontendClient.installConnector(
                            project.id,
                            connector2.id,
                            connectorToInstall
                        );
                    }
                );

                it(
                    'should have 2 finished tasks and 2 installed connectors',
                    async() => {
                        await waitFor(() => {
                            expect(client.tasks)
                                .toHaveLength(2);

                            for (const taskFound of client.tasks) {
                                expect(isTaskSucceed(taskFound))
                                    .toBeTruthy();
                            }
                        });

                        const tasksFound = await Promise.all([
                            commanderApp.frontendClient.getTaskById(
                                project.id,
                                task.id
                            ),
                            commanderApp.frontendClient.getTaskById(
                                project.id,
                                task2.id
                            ),
                        ]);
                        for (const taskFound of tasksFound) {
                            expect(isTaskSucceed(taskFound))
                                .toBeTruthy();
                        }

                        const connectorsFound = await Promise.all([
                            commanderApp.frontendClient.getConnectorById(
                                project.id,
                                connector.id
                            ),
                            commanderApp.frontendClient.getConnectorById(
                                project.id,
                                connector2.id
                            ),
                        ]);
                        for (const connectorFound of connectorsFound) {
                            const connectorConfigFound = connectorFound.config as IConnectorDatacenterLocalConfig;
                            expect(connectorConfigFound.imageId?.length)
                                .toBeGreaterThan(0);
                        }
                    }
                );

                it(
                    'should remove task2',
                    async() => {
                        await Promise.all([
                            commanderApp.frontendClient.removeTask(
                                project.id,
                                task.id
                            ),
                            commanderApp.frontendClient.removeTask(
                                project.id,
                                task2.id
                            ),
                        ]);

                        await waitFor(() => {
                            expect(client.tasks)
                                .toHaveLength(0);
                        });

                        const tasksFound = await commanderApp.frontendClient.getAllProjectTasksById(project.id);
                        expect(tasksFound)
                            .toHaveLength(0);
                    }
                );
            }
        );

        describe(
            'Cancel a running task',
            () => {
                it(
                    'should start an install task',
                    async() => {
                        const connectorToInstall: IConnectorToInstall = {
                            config: {},
                        };
                        task = await commanderApp.frontendClient.installConnector(
                            project.id,
                            connector.id,
                            connectorToInstall
                        );

                        await waitFor(() => {
                            expect(client.tasks)
                                .toHaveLength(1);
                        });
                    }
                );

                it(
                    'should cancel a running task',
                    async() => {
                        await commanderApp.frontendClient.cancelTask(
                            project.id,
                            task.id
                        );

                        await waitFor(() => {
                            expect(client.tasks)
                                .toHaveLength(1);

                            const taskFound = client.tasks[ 0 ];
                            expect(taskFound.cancelled)
                                .toBeTruthy();
                        });

                        const taskFound = await commanderApp.frontendClient.getTaskById(
                            project.id,
                            task.id
                        );
                        expect(taskFound.cancelled)
                            .toBeTruthy();
                    }
                );

                it(
                    'should have a stopped task',
                    async() => {
                        await waitFor(() => {
                            expect(client.tasks)
                                .toHaveLength(1);

                            const taskFound = client.tasks[ 0 ];
                            expect(taskFound.running)
                                .toBeFalsy();

                            expect(taskFound.stepCurrent).not.toBe(taskFound.stepMax);
                        });

                        const taskFound = await commanderApp.frontendClient.getTaskById(
                            project.id,
                            task.id
                        );
                        expect(taskFound.running)
                            .toBeFalsy();

                        expect(taskFound.stepCurrent).not.toBe(taskFound.stepMax);
                    }
                );

                it(
                    'should not cancel a stopped task',
                    async() => {
                        await expect(commanderApp.frontendClient.cancelTask(
                            project.id,
                            task.id
                        ))
                            .rejects
                            .toThrowError(TaskCancelError);
                    }
                );

                it(
                    'should remove the task',
                    async() => {
                        await commanderApp.frontendClient.removeTask(
                            project.id,
                            task.id
                        );

                        await waitFor(() => {
                            expect(client.tasks)
                                .toHaveLength(0);
                        });

                        const tasksFound = await commanderApp.frontendClient.getAllProjectTasksById(project.id);
                        expect(tasksFound)
                            .toHaveLength(0);
                    }
                );
            }
        );
    }
);
