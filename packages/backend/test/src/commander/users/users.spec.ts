import { Logger } from '@nestjs/common';
import {
    Agents,
    CommanderFrontendClient,
    getEnvFrontendJwtConfig,
    JwtInvalidError,
    ProjectInaccessibleError,
    ProjectUserAccessError,
    UserEmailAlreadyExistsError,
    UserProfileIncompleteError,
    ValidationError,
} from '@scrapoxy/backend-sdk';
import {
    CommanderApp,
    CommanderUsersClient,
    TestServers,
    USERAGENT_TEST,
    waitFor,
} from '@scrapoxy/backend-test-sdk';
import { CloudlocalApp } from '@scrapoxy/cloudlocal';
import {
    ECommanderError,
    EEventScope,
    EventsProjectClient,
    EventsService,
    EventsUserClient,
    ONE_MINUTE_IN_MS,
    sleep,
} from '@scrapoxy/common';
import { v4 as uuid } from 'uuid';
import type {
    ICommanderFrontendClient,
    IProjectData,
    IProjectToCreate,
    IProjectToUpdate,
    IUserToUpdate,
    IUserView,
} from '@scrapoxy/common';


describe(
    'Commander - Users',
    () => {
        const logger = new Logger();
        const
            agents = new Agents(),
            cloudlocalApp = new CloudlocalApp(logger),
            projectToCreate: IProjectToCreate = {
                name: 'project A',
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
            },
            servers = new TestServers();
        let
            authClientA: CommanderUsersClient,
            authClientB: CommanderUsersClient,
            clientUserA: EventsUserClient,
            clientUserAprojectA: EventsProjectClient,
            clientUserAprojectB: EventsProjectClient,
            clientUserB: EventsUserClient,
            clientUserBprojectB: EventsProjectClient,
            commanderA: ICommanderFrontendClient,
            commanderApp: CommanderApp,
            commanderB: ICommanderFrontendClient,
            eventsA: EventsService,
            eventsB: EventsService,
            projectA: IProjectData,
            projectB: IProjectData,
            userA: IUserView,
            userB: IUserView;

        beforeAll(async() => {
            // Start target & local cloud
            await Promise.all([
                servers.listen(), cloudlocalApp.start(),
            ]);

            // Start app
            commanderApp = CommanderApp.defaults({
                cloudlocalAppUrl: cloudlocalApp.url,
                fingerprintUrl: servers.urlFingerprint,
                logger,
            });
            await commanderApp.start();
        });

        afterAll(async() => {
            const promises: Promise<void>[] = [];

            if (clientUserBprojectB) {
                promises.push(clientUserBprojectB.unsubscribeAsync());
            }

            if (clientUserAprojectB) {
                promises.push(clientUserAprojectB.unsubscribeAsync());
            }

            if (clientUserAprojectA) {
                promises.push(clientUserAprojectA.unsubscribeAsync());
            }

            if (clientUserB) {
                clientUserB.unsubscribe();
            }

            if (clientUserA) {
                promises.push(clientUserAprojectA.unsubscribeAsync());
            }

            await Promise.all(promises);

            if (eventsB) {
                eventsB.disconnect();
            }

            if (eventsA) {
                eventsA.disconnect();
            }

            await commanderApp.stop();

            await Promise.all([
                cloudlocalApp.close(), servers.close(),
            ]);

            agents.close();
        });

        describe(
            'Users',
            () => {
                it(
                    'should not connect without token',
                    async() => {
                        const events = new EventsService();

                        await events.connect(
                            commanderApp.eventsUrl,
                            void 0
                        );

                        await waitFor(() => {
                            expect(events.connected)
                                .toBeFalsy();
                            expect(events.firstConnection)
                                .toBeFalsy();
                        });

                        events.disconnect();
                    }
                );

                it(
                    'should signup, login and connect both users',
                    async() => {
                    // User A
                        authClientA = await CommanderUsersClient.generateUser(
                            commanderApp.url,
                            USERAGENT_TEST
                        );
                        expect(authClientA.jwtToken.length)
                            .toBeGreaterThan(0);

                        commanderA = new CommanderFrontendClient(
                            commanderApp.url,
                            USERAGENT_TEST,
                            authClientA.jwtToken,
                            agents
                        );

                        userA = await authClientA.getMe();

                        eventsA = new EventsService();
                        clientUserA = new EventsUserClient(
                            eventsA,
                            userA
                        );

                        await eventsA.connect(
                            commanderApp.eventsUrl,
                            authClientA.jwtToken
                        );
                        clientUserA.subscribe();

                        await waitFor(() => {
                            expect(eventsA.connected)
                                .toBeTruthy();
                        });

                        // User B
                        authClientB = await CommanderUsersClient.generateUser(
                            commanderApp.url,
                            USERAGENT_TEST
                        );
                        expect(authClientB.jwtToken.length)
                            .toBeGreaterThan(0);

                        commanderB = new CommanderFrontendClient(
                            commanderApp.url,
                            USERAGENT_TEST,
                            authClientB.jwtToken,
                            agents
                        );

                        userB = await authClientB.getMe();

                        eventsB = new EventsService();
                        clientUserB = new EventsUserClient(
                            eventsB,
                            userB
                        );

                        await eventsB.connect(
                            commanderApp.eventsUrl,
                            authClientB.jwtToken
                        );
                        clientUserB.subscribe();

                        await waitFor(() => {
                            expect(eventsB.connected)
                                .toBeTruthy();
                        });
                    }
                );

                it(
                    'should get a list of auth providers',
                    async() => {
                        const auths = await authClientA.getAllAuths();
                        expect(auths)
                            .toHaveLength(1);

                        const auth = auths[ 0 ];
                        expect(auth.name)
                            .toBe('local');
                    }
                );

                it(
                    'should logout users through cookie',
                    async() => {
                        const jwt = await authClientA.getLogoutJwt();
                        expect(jwt)
                            .toHaveLength(0);
                    }
                );

                it(
                    'should disallow user A with an expired token',
                    async() => {
                        const
                            authClient = await CommanderUsersClient.generateUser(
                                commanderApp.url,
                                USERAGENT_TEST
                            ),
                            config = getEnvFrontendJwtConfig();

                        authClient.changeJwtExpiration(
                            config.secret,
                            '1s'
                        );

                        const commander = new CommanderFrontendClient(
                            commanderApp.url,
                            USERAGENT_TEST,
                            authClient.jwtToken,
                            agents
                        );

                        await sleep(2000);

                        await expect(commander.getAllProjectsForUserId())
                            .rejects
                            .toThrowError(JwtInvalidError);
                    }
                );

                it(
                    'should renew user A token',
                    async() => {
                        const expiration = authClientA.jwtExpiration;
                        await authClientA.renewJwt();

                        const newExpiration = authClientA.jwtExpiration;

                        expect(expiration)
                            .toBeLessThan(newExpiration);
                    }
                );

                it(
                    'should not update profile of user A to email of user B',
                    async() => {
                        const
                            userToUpdate: IUserToUpdate = {
                                name: userA.name,
                                email: userB.email,
                                picture: userA.picture,
                            };
                        await expect(authClientA.updateMe(userToUpdate))
                            .rejects
                            .toThrowError(UserEmailAlreadyExistsError);
                    }
                );

                it(
                    'should update profile of user A',
                    async() => {
                        const
                            user = await authClientA.getMe(),
                            userToUpdate: IUserToUpdate = {
                                name: `${user.name}-updated`,
                                email: `${user.email}-updated`,
                                picture: `${user.picture}-updated`,
                            };
                        const
                            eventsCountA = eventsA.eventsCount,
                            eventsCountB = eventsB.eventsCount;
                        userA = await authClientA.updateMe(userToUpdate);
                        expect(userA.name)
                            .toBe(userToUpdate.name);
                        expect(userA.email)
                            .toBe(userToUpdate.email);
                        expect(userA.picture)
                            .toBe(userToUpdate.picture);

                        await waitFor(() => {
                            expect(eventsA.eventsCount)
                                .toBe(eventsCountA + 1);
                            expect(eventsB.eventsCount)
                                .toBe(eventsCountB);

                            expect(clientUserA.user.name)
                                .toBe(userToUpdate.name);
                            expect(clientUserA.user.email)
                                .toBe(userToUpdate.email);
                            expect(clientUserA.user.picture)
                                .toBe(userToUpdate.picture);
                        });

                        const userFound = await authClientA.getMe();
                        expect(userFound.name)
                            .toBe(userToUpdate.name);
                        expect(userFound.email)
                            .toBe(userToUpdate.email);
                        expect(userFound.picture)
                            .toBe(userToUpdate.picture);
                    }
                );
            }
        );

        describe(
            'Projects',
            () => {
                it(
                    'should forbid listing projects for incomplete user profile',
                    async() => {
                        const authClient = await CommanderUsersClient.generateUser(
                            commanderApp.url,
                            USERAGENT_TEST,
                            'invalidemail'
                        );
                        const commander = new CommanderFrontendClient(
                            commanderApp.url,
                            USERAGENT_TEST,
                            authClient.jwtToken,
                            agents
                        );
                        await expect(commander.getAllProjectsForUserId())
                            .rejects
                            .toThrowError(UserProfileIncompleteError);
                    }
                );

                it(
                    'should disallow user A to access to an unknown project',
                    async() => {
                        await expect(commanderA.getProjectById(uuid()))
                            .rejects
                            .toThrowError(ProjectInaccessibleError);
                    }
                );

                it(
                    'should have no projects for both users',
                    async() => {
                        const projectsA = await commanderA.getAllProjectsForUserId();
                        expect(projectsA)
                            .toHaveLength(0);

                        const projectsB = await commanderB.getAllProjectsForUserId();
                        expect(projectsB)
                            .toHaveLength(0);
                    }
                );

                it(
                    'should create projects for both users',
                    async() => {
                        projectA = await commanderA.createProject(projectToCreate);
                        clientUserAprojectA = new EventsProjectClient(eventsA);
                        await clientUserAprojectA.subscribeAsync(projectA);
                        await eventsA.registerAsync({
                            scope: EEventScope.PROJECT,
                            projectId: projectA.id,
                        });

                        projectB = await commanderB.createProject({
                            ...projectToCreate,
                            name: 'project B',
                        });
                        clientUserBprojectB = new EventsProjectClient(eventsB);
                        await clientUserBprojectB.subscribeAsync(projectB);
                        await eventsB.registerAsync({
                            scope: EEventScope.PROJECT,
                            projectId: projectB.id,
                        });
                    }
                );

                it(
                    'should disallow access to a project without token',
                    async() => {
                        const commander = new CommanderFrontendClient(
                            commanderApp.url,
                            USERAGENT_TEST,
                            '',
                            agents
                        );

                        await expect(commander.getProjectById(projectA.id))
                            .rejects
                            .toThrowError(JwtInvalidError);
                    }
                );

                it(
                    'should allow user A to get project A',
                    async() => {
                        const projectsFound = await commanderA.getAllProjectsForUserId();
                        expect(projectsFound)
                            .toHaveLength(1);

                        const projectFound = await commanderA.getProjectById(projectA.id);
                        expect(projectFound.id)
                            .toBe(projectA.id);
                    }
                );

                it(
                    'should disallow user A to access project B',
                    async() => {
                        await expect(commanderA.getProjectById(projectB.id))
                            .rejects
                            .toThrowError(ProjectInaccessibleError);

                        await eventsA.registerAsync({
                            scope: EEventScope.PROJECT,
                            projectId: projectB.id,
                        });

                        await waitFor(() => {
                            expect(eventsA.popError().id)
                                .toBe(ECommanderError.ProjectInaccessible);
                        });
                    }
                );

                it(
                    'should not add access to user A to its own project A',
                    async() => {
                        await expect(commanderA.addUserToProjectByEmail(
                            projectA.id,
                            userA.email as string
                        ))
                            .rejects
                            .toThrowError(ProjectUserAccessError);
                    }
                );

                it(
                    'should not add access to unknown user A to project B',
                    async() => {
                        await expect(commanderA.addUserToProjectByEmail(
                            projectA.id,
                            ''
                        ))
                            .rejects
                            .toThrowError(ValidationError);
                    }
                );

                it(
                    'should add access to user A to project B',
                    async() => {
                        await commanderB.addUserToProjectByEmail(
                            projectB.id,
                            userA.email as string
                        );

                        const projectsFound = await commanderA.getAllProjectsForUserId();
                        expect(projectsFound)
                            .toHaveLength(2);

                        const projectFound = await commanderA.getProjectById(projectB.id);
                        expect(projectFound.id)
                            .toBe(projectB.id);

                        clientUserAprojectB = new EventsProjectClient(eventsA);
                        await clientUserAprojectB.subscribeAsync(projectB);

                        await eventsA.registerAsync({
                            scope: EEventScope.PROJECT,
                            projectId: projectB.id,
                        });
                    }
                );

                it(
                    'should not re-add access to user A to project B',
                    async() => {
                        await expect(commanderB.addUserToProjectByEmail(
                            projectB.id,
                            userA.email as string
                        ))
                            .rejects
                            .toThrowError(ProjectUserAccessError);
                    }
                );

                it(
                    'should allow user B to get project B',
                    async() => {
                        const projectsFound = await commanderB.getAllProjectsForUserId();
                        expect(projectsFound)
                            .toHaveLength(1);

                        const projectFound = await commanderB.getProjectById(projectB.id);
                        expect(projectFound.id)
                            .toBe(projectB.id);
                    }
                );

                it(
                    'should disallow user B to get project A',
                    async() => {
                        await expect(commanderB.getProjectById(projectA.id))
                            .rejects
                            .toThrowError(ProjectInaccessibleError);

                        await eventsB.registerAsync({
                            scope: EEventScope.PROJECT,
                            projectId: projectA.id,
                        });

                        await waitFor(() => {
                            expect(eventsB.popError().id)
                                .toBe(ECommanderError.ProjectInaccessible);
                        });
                    }
                );

                it(
                    'should modify project A and send notification only to user A',
                    async() => {
                        const projectUpdate: IProjectToUpdate = {
                            ...projectToCreate,
                            name: 'project A updated',
                        };
                        const
                            eventsCountA = eventsA.eventsCount,
                            eventsCountB = eventsB.eventsCount;
                        await commanderA.updateProject(
                            projectA.id,
                            projectUpdate
                        );

                        await waitFor(() => {
                            expect(eventsA.eventsCount)
                                .toBe(eventsCountA + 1);
                            expect(eventsB.eventsCount)
                                .toBe(eventsCountB);

                            expect(clientUserAprojectA.project?.name)
                                .toBe(projectUpdate.name);
                        });
                    }
                );

                it(
                    'should modify project B and send notification to both users',
                    async() => {
                        const projectUpdate: IProjectToUpdate = {
                            ...projectToCreate,
                            name: 'project B updated',
                        };
                        const
                            eventsCountA = eventsA.eventsCount,
                            eventsCountB = eventsB.eventsCount;
                        await commanderB.updateProject(
                            projectB.id,
                            projectUpdate
                        );

                        await waitFor(() => {
                            expect(eventsA.eventsCount)
                                .toBe(eventsCountA + 1);
                            expect(eventsB.eventsCount)
                                .toBe(eventsCountB + 1);

                            expect(clientUserBprojectB.project?.name)
                                .toBe(projectUpdate.name);
                            expect(clientUserAprojectB.project?.name)
                                .toBe(projectUpdate.name);
                        });
                    }
                );

                it(
                    'should unregister user A from project B events',
                    async() => {
                        await eventsA.unregisterAsync({
                            scope: EEventScope.PROJECT,
                            projectId: projectB.id,
                        });

                        const projectUpdate: IProjectToUpdate = {
                            ...projectToCreate,
                            name: 'project B updated 2',
                        };
                        const
                            eventsCountA = eventsA.eventsCount,
                            eventsCountB = eventsB.eventsCount;
                        await commanderB.updateProject(
                            projectB.id,
                            projectUpdate
                        );

                        await waitFor(() => {
                            expect(eventsA.eventsCount)
                                .toBe(eventsCountA);
                            expect(eventsB.eventsCount)
                                .toBe(eventsCountB + 1);
                        });
                    }
                );

                it(
                    'should register user A to project B events',
                    async() => {
                        await eventsA.registerAsync({
                            scope: EEventScope.PROJECT,
                            projectId: projectB.id,
                        });
                    }
                );

                it(
                    'should remove access of user B from project B',
                    async() => {
                        const
                            eventsCountA = eventsA.eventsCount,
                            eventsCountB = eventsB.eventsCount;

                        await commanderA.removeUserFromProject(
                            projectB.id,
                            userB.id
                        );

                        const projectUpdate: IProjectToUpdate = {
                            ...projectToCreate,
                            name: 'project B updated 3',
                        };

                        await expect(commanderB.updateProject(
                            projectB.id,
                            projectUpdate
                        ))
                            .rejects
                            .toThrowError(ProjectInaccessibleError);
                        await commanderA.updateProject(
                            projectB.id,
                            projectUpdate
                        );

                        await waitFor(() => {
                            expect(eventsA.eventsCount)
                                .toBe(eventsCountA + 2); // include remove event
                            expect(eventsB.eventsCount)
                                .toBe(eventsCountB + 1); // include remove event
                        });
                    }
                );

                it(
                    'should not remove access of user A to its own project',
                    async() => {
                        await expect(commanderA.removeUserFromProject(
                            projectA.id,
                            userA.id
                        ))
                            .rejects
                            .toThrowError(ProjectUserAccessError);
                    }
                );
            }
        );
    }
);
