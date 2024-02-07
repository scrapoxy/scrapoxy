import {
    Controller,
    Inject,
    Logger,
} from '@nestjs/common';
import {
    ClientProxy,
    EventPattern,
} from '@nestjs/microservices';
import {
    ConnectorCreatedEvent,
    ConnectorRemovedEvent,
    ConnectorUpdatedEvent,
    CredentialCreatedEvent,
    CredentialRemovedEvent,
    CredentialUpdatedEvent,
    EEventScope,
    FreeproxiesCreatedEvent,
    FreeproxiesSynchronizedEvent,
    ProjectMetricsAddedEvent,
    ProjectRemovedEvent,
    ProjectUpdatedEvent,
    ProjectUserAddedEvent,
    ProjectUserRemovedEvent,
    ProxiesMetricsAddedEvent,
    ProxiesSynchronizedEvent,
    SourcesCreatedEvent,
    SourcesRemovedEvent,
    TaskCreatedEvent,
    TaskRemovedEvent,
    TaskUpdatedEvent,
    toConnectorView,
    toCredentialView,
    toSynchronizeLocalProxiesBase,
    toTaskView,
    toUserView,
    UserUpdatedEvent,
} from '@scrapoxy/common';
import { lastValueFrom } from 'rxjs';
import { ProbeprovidersService } from '../../../probe';
import {
    DISTRIBUTED_MS_SERVICE,
    MESSAGE_CERTIFICATE_CREATE,
    MESSAGE_CONNECTORS_CREATE,
    MESSAGE_CONNECTORS_REMOVE,
    MESSAGE_CONNECTORS_UPDATE,
    MESSAGE_CONNECTORS_UPDATE_CERTIFICATE,
    MESSAGE_CONNECTORS_UPDATE_NEXT_REFRESH,
    MESSAGE_CREDENTIALS_CREATE,
    MESSAGE_CREDENTIALS_REMOVE,
    MESSAGE_CREDENTIALS_UPDATE,
    MESSAGE_EVENTS,
    MESSAGE_FREEPROXIES_CREATE,
    MESSAGE_FREEPROXIES_SYNC,
    MESSAGE_FREEPROXIES_UPDATE_NEXT_REFRESH,
    MESSAGE_PROJECTS_ADD_USER,
    MESSAGE_PROJECTS_CREATE,
    MESSAGE_PROJECTS_METRICS_ADD,
    MESSAGE_PROJECTS_REMOVE,
    MESSAGE_PROJECTS_REMOVE_USER,
    MESSAGE_PROJECTS_TOKEN_UPDATE,
    MESSAGE_PROJECTS_UPDATE,
    MESSAGE_PROJECTS_UPDATE_LAST_DATA,
    MESSAGE_PROXIES_METRICS_ADD,
    MESSAGE_PROXIES_SYNC,
    MESSAGE_PROXIES_UPDATE_LAST_CONNECTION,
    MESSAGE_PROXIES_UPDATE_NEXT_REFRESH,
    MESSAGE_SOURCE_UPDATE_NEXT_REFRESH,
    MESSAGE_SOURCES_CREATE,
    MESSAGE_SOURCES_REMOVED,
    MESSAGE_TASKS_CREATE,
    MESSAGE_TASKS_LOCK,
    MESSAGE_TASKS_REMOVE,
    MESSAGE_TASKS_UPDATE,
    MESSAGE_USERS_CREATE,
    MESSAGE_USERS_UPDATE,
} from '../distributed.constants';
import { StorageMongoService } from '../mongo';
import type { IProbeService } from '../../../probe';
import type { IStorageService } from '../../providers.interface';
import type { IAmqpConnectionManager } from '../amqp.interface';
import type { OnModuleInit } from '@nestjs/common';
import type {
    ICertificateToCreate,
    IConnectorCertificateToUpdate,
    IConnectorData,
    IConnectorDataToCreate,
    IConnectorNextRefreshToUpdate,
    ICredentialData,
    IEvent,
    IFreeproxiesNextRefreshToUpdate,
    IFreeproxiesToCreate,
    IProjectData,
    IProjectDataCreate,
    IProjectLastDataToUpdate,
    IProjectMetricsAddView,
    IProjectTokenToUpdate,
    IProjectUserLink,
    IProxiesNextRefreshToUpdate,
    IProxyLastConnectionToUpdate,
    IProxyMetricsAdd,
    ISource,
    ISourceNextRefreshToUpdate,
    ISynchronizeFreeproxies,
    ISynchronizeLocalProxiesData,
    ITaskData,
    ITaskToLock,
    IUserData,
} from '@scrapoxy/common';


@Controller()
export class StorageDistributedMsController implements IProbeService, OnModuleInit {
    readonly type = 'distributems';

    alive = false;

    private readonly logger = new Logger(StorageDistributedMsController.name);

    constructor(
        @Inject(StorageMongoService)
        private readonly storage: IStorageService,
        probes: ProbeprovidersService,
        @Inject(DISTRIBUTED_MS_SERVICE)
        private readonly proxy: ClientProxy

    ) {
        probes.register(this);
    }


    //////////// USERS ////////////
    @EventPattern(MESSAGE_USERS_CREATE)
    async createUser(user: IUserData): Promise<void> {
        this.logger.debug(`createUser(): user.id=${user.id}`);

        await this.storage.createUser(user);
    }

    @EventPattern(MESSAGE_USERS_UPDATE)
    async updateUser(user: IUserData): Promise<void> {
        this.logger.debug(`updateUser(): user.id=${user.id}`);

        await this.storage.updateUser(user);

        const event: IEvent = {
            id: user.id,
            scope: EEventScope.USER,
            event: new UserUpdatedEvent(toUserView(user)),
        };

        await lastValueFrom(this.proxy.emit(
            MESSAGE_EVENTS,
            [
                event,
            ]
        ));
    }

    //////////// PROJECTS ////////////
    @EventPattern(MESSAGE_PROJECTS_CREATE)
    async createProject(create: IProjectDataCreate): Promise<void> {
        this.logger.debug(`createProject(): create.userId=${create.userId}, create.project.name=${create.project.name}`);

        await this.storage.createProject(create);
    }

    @EventPattern(MESSAGE_PROJECTS_UPDATE)
    async updateProject(project: IProjectData): Promise<void> {
        this.logger.debug(`updateProject(): project.id=${project.id}`);

        await this.storage.updateProject(project);

        const event: IEvent = {
            id: project.id,
            scope: EEventScope.PROJECT,
            event: new ProjectUpdatedEvent(project),
        };

        await lastValueFrom(this.proxy.emit(
            MESSAGE_EVENTS,
            [
                event,
            ]
        ));
    }

    @EventPattern(MESSAGE_PROJECTS_UPDATE_LAST_DATA)
    async updateProjectLastDataTs(update: IProjectLastDataToUpdate): Promise<void> {
        this.logger.debug(`updateProjectLastDataTs(): update.projectId=${update.projectId} / update.lastDataTs=${update.lastDataTs}`);

        await this.storage.updateProjectLastDataTs(
            update.projectId,
            update.lastDataTs
        );
    }

    @EventPattern(MESSAGE_PROJECTS_REMOVE)
    async removeProject(project: IProjectData): Promise<void> {
        this.logger.debug(`updateProject(): project.id=${project.id}`);

        await this.storage.removeProject(project);

        const event: IEvent = {
            id: project.id,
            scope: EEventScope.PROJECT,
            event: new ProjectRemovedEvent(project),

        };

        await lastValueFrom(this.proxy.emit(
            MESSAGE_EVENTS,
            [
                event,
            ]
        ));
    }

    @EventPattern(MESSAGE_PROJECTS_ADD_USER)
    async addUserToProject(link: IProjectUserLink): Promise<void> {
        this.logger.debug(`addUserToProject(): link.projectId=${link.projectId} / link.userId=${link.userId}`);

        await this.storage.addUserToProject(link);

        const event: IEvent = {
            id: link.projectId,
            scope: EEventScope.PROJECT,
            event: new ProjectUserAddedEvent(link),
        };

        await lastValueFrom(this.proxy.emit(
            MESSAGE_EVENTS,
            [
                event,
            ]
        ));
    }

    @EventPattern(MESSAGE_PROJECTS_REMOVE_USER)
    async removeUserFromProject(link: IProjectUserLink): Promise<void> {
        this.logger.debug(`removeUserFromProject(): link.projectId=${link.projectId} / link.userId=${link.userId}`);

        await this.storage.removeUserFromProject(link);

        const event: IEvent = {
            id: link.projectId,
            scope: EEventScope.PROJECT,
            event: new ProjectUserRemovedEvent(link),
        };

        await lastValueFrom(this.proxy.emit(
            MESSAGE_EVENTS,
            [
                event,
            ]
        ));
    }

    @EventPattern(MESSAGE_PROJECTS_METRICS_ADD)
    async addProjectsMetrics(views: IProjectMetricsAddView[]): Promise<void> {
        this.logger.debug(`addProjectsMetrics(): views.length=${views.length}`);

        await this.storage.addProjectsMetrics(views);

        const events = views.map((m) => {
            const event: IEvent = {
                id: m.project.id,
                scope: EEventScope.METRICS,
                event: new ProjectMetricsAddedEvent(m),
            };

            return event;
        });

        await lastValueFrom(this.proxy.emit(
            MESSAGE_EVENTS,
            events
        ));
    }

    @EventPattern(MESSAGE_PROJECTS_TOKEN_UPDATE)
    async updateProjectToken(update: IProjectTokenToUpdate): Promise<void> {
        this.logger.debug(`updateProjectToken(): projectId=${update.projectId}`);

        await this.storage.updateProjectToken(
            update.projectId,
            update.token
        );
    }

    //////////// CREDENTIALS ////////////
    @EventPattern(MESSAGE_CREDENTIALS_CREATE)
    async createCredential(credential: ICredentialData): Promise<void> {
        this.logger.debug(`createCredential(): credential.id=${credential.id}`);

        await this.storage.createCredential(credential);

        const event: IEvent = {
            id: credential.projectId,
            scope: EEventScope.PROJECT,
            event: new CredentialCreatedEvent(toCredentialView(credential)),

        };

        await lastValueFrom(this.proxy.emit(
            MESSAGE_EVENTS,
            [
                event,
            ]
        ));
    }

    @EventPattern(MESSAGE_CREDENTIALS_UPDATE)
    async updateCredential(credential: ICredentialData): Promise<void> {
        this.logger.debug(`updateCredential(): credential.id=${credential.id}`);

        await this.storage.updateCredential(credential);

        const event: IEvent = {
            id: credential.projectId,
            scope: EEventScope.PROJECT,
            event: new CredentialUpdatedEvent(toCredentialView(credential)),

        };

        await lastValueFrom(this.proxy.emit(
            MESSAGE_EVENTS,
            [
                event,
            ]
        ));
    }

    @EventPattern(MESSAGE_CREDENTIALS_REMOVE)
    async removeCredential(credential: ICredentialData): Promise<void> {
        this.logger.debug(`removeCredential(): credential.id=${credential.id}`);

        await this.storage.removeCredential(credential);

        const event: IEvent = {
            id: credential.projectId,
            scope: EEventScope.PROJECT,
            event: new CredentialRemovedEvent(toCredentialView(credential)),

        };

        await lastValueFrom(this.proxy.emit(
            MESSAGE_EVENTS,
            [
                event,
            ]
        ));
    }

    //////////// CONNECTORS ////////////
    @EventPattern(MESSAGE_CONNECTORS_CREATE)
    async createConnector(connector: IConnectorDataToCreate): Promise<void> {
        this.logger.debug(`createConnector(): connector.id=${connector.id}`);

        await this.storage.createConnector(connector);

        const event: IEvent = {
            id: connector.projectId,
            scope: EEventScope.PROJECT,
            event: new ConnectorCreatedEvent(toConnectorView(connector)),

        };

        await lastValueFrom(this.proxy.emit(
            MESSAGE_EVENTS,
            [
                event,
            ]
        ));
    }

    @EventPattern(MESSAGE_CONNECTORS_UPDATE)
    async updateConnector(connector: IConnectorData): Promise<void> {
        this.logger.debug(`updateConnector(): connector.id=${connector.id}`);

        await this.storage.updateConnector(connector);

        const event: IEvent = {
            id: connector.projectId,
            scope: EEventScope.PROJECT,
            event: new ConnectorUpdatedEvent(toConnectorView(connector)),

        };

        await lastValueFrom(this.proxy.emit(
            MESSAGE_EVENTS,
            [
                event,
            ]
        ));
    }

    @EventPattern(MESSAGE_CONNECTORS_UPDATE_CERTIFICATE)
    async updateConnectorCertificate(update: IConnectorCertificateToUpdate): Promise<void> {
        this.logger.debug(`updateConnectorCertificate(): projectId=${update.projectId} / connectorId=${update.connectorId}`);

        await this.storage.updateConnectorCertificate(
            update.projectId,
            update.connectorId,
            update.certificateInfo
        );

        const connector = await this.storage.getConnectorById(
            update.projectId,
            update.connectorId
        );
        const event: IEvent = {
            id: update.projectId,
            scope: EEventScope.PROJECT,
            event: new ConnectorUpdatedEvent(toConnectorView(connector)),

        };

        await lastValueFrom(this.proxy.emit(
            MESSAGE_EVENTS,
            [
                event,
            ]
        ));
    }

    @EventPattern(MESSAGE_CONNECTORS_REMOVE)
    async removeConnector(connector: IConnectorData): Promise<void> {
        this.logger.debug(`removeConnector(): connector.id=${connector.id}`);

        await this.storage.removeConnector(connector);

        const event: IEvent = {
            id: connector.projectId,
            scope: EEventScope.PROJECT,
            event: new ConnectorRemovedEvent(toConnectorView(connector)),

        };

        await lastValueFrom(this.proxy.emit(
            MESSAGE_EVENTS,
            [
                event,
            ]
        ));
    }

    @EventPattern(MESSAGE_CONNECTORS_UPDATE_NEXT_REFRESH)
    async updateConnectorNextRefreshTs(update: IConnectorNextRefreshToUpdate): Promise<void> {
        this.logger.debug(`updateConnectorNextRefreshTs(): projectId=${update.projectId} / connectorId=${update.connectorId} / nextRefreshTs=${update.nextRefreshTs}`);

        await this.storage.updateConnectorNextRefreshTs(
            update.projectId,
            update.connectorId,
            update.nextRefreshTs
        );
    }

    //////////// PROXIES ////////////
    @EventPattern(MESSAGE_PROXIES_SYNC)
    async synchronizeProxies(actions: ISynchronizeLocalProxiesData): Promise<void> {
        this.logger.debug(`synchronizeProxies(): created.length=${actions.created.length} / updated.length=${actions.updated.length} / removed.length=${actions.removed.length}`);

        await this.storage.synchronizeProxies(actions);

        const actionsByProjects = new Map<string, ISynchronizeLocalProxiesData>();
        for (const proxy of actions.created) {
            let actionsByProject = actionsByProjects.get(proxy.projectId);

            if (actionsByProject) {
                actionsByProject.created.push(proxy);
            } else {
                actionsByProject = {
                    created: [
                        proxy,
                    ],
                    updated: [],
                    removed: [],
                };
                actionsByProjects.set(
                    proxy.projectId,
                    actionsByProject
                );
            }
        }

        for (const proxy of actions.updated) {
            let actionsByProject = actionsByProjects.get(proxy.projectId);

            if (actionsByProject) {
                actionsByProject.updated.push(proxy);
            } else {
                actionsByProject = {
                    created: [],
                    updated: [
                        proxy,
                    ],
                    removed: [],
                };
                actionsByProjects.set(
                    proxy.projectId,
                    actionsByProject
                );
            }
        }

        for (const proxy of actions.removed) {
            let actionsByProject = actionsByProjects.get(proxy.projectId);

            if (actionsByProject) {
                actionsByProject.removed.push(proxy);
            } else {
                actionsByProject = {
                    created: [],
                    updated: [],
                    removed: [
                        proxy,
                    ],
                };
                actionsByProjects.set(
                    proxy.projectId,
                    actionsByProject
                );
            }
        }

        const events: IEvent[] = [];
        for (const [
            projectId, actionsByProject,
        ] of actionsByProjects.entries()) {
            events.push({
                id: projectId,
                scope: EEventScope.PROXIES,
                event: new ProxiesSynchronizedEvent(toSynchronizeLocalProxiesBase(actionsByProject)),
            });
        }

        await lastValueFrom(this.proxy.emit(
            MESSAGE_EVENTS,
            events
        ));
    }

    @EventPattern(MESSAGE_PROXIES_METRICS_ADD)
    async addProxiesMetrics(proxies: IProxyMetricsAdd[]): Promise<void> {
        this.logger.debug(`addProxiesMetrics(): proxies.length=${proxies.length}`);

        await this.storage.addProxiesMetrics(proxies);

        const metricsByProjects = new Map<string, IProxyMetricsAdd[]>();
        for (const proxy of proxies) {
            const metricsByProject = metricsByProjects.get(proxy.projectId);

            if (metricsByProject) {
                metricsByProject.push(proxy);
            } else {
                metricsByProjects.set(
                    proxy.projectId,
                    [
                        proxy,
                    ]
                );
            }
        }

        const events: IEvent[] = [];
        for (const [
            projectId, proxiesByProject,
        ] of metricsByProjects.entries()) {
            const event: IEvent = {
                id: projectId,
                scope: EEventScope.PROXIES,
                event: new ProxiesMetricsAddedEvent(proxiesByProject),

            };
            events.push(event);
        }

        await lastValueFrom(this.proxy.emit(
            MESSAGE_EVENTS,
            events
        ));
    }

    @EventPattern(MESSAGE_PROXIES_UPDATE_LAST_CONNECTION)
    async updateProxyLastConnectionTs(update: IProxyLastConnectionToUpdate): Promise<void> {
        this.logger.debug(`updateProxyLastConnectionTs(): projectId=${update.projectId} / connectorId=${update.connectorId} / proxyId=${update.proxyId} / lastConnectionTs=${update.lastConnectionTs}`);

        await this.storage.updateProxyLastConnectionTs(
            update.projectId,
            update.connectorId,
            update.proxyId,
            update.lastConnectionTs
        );
    }

    @EventPattern(MESSAGE_PROXIES_UPDATE_NEXT_REFRESH)
    async updateProxiesNextRefreshTs(update: IProxiesNextRefreshToUpdate): Promise<void> {
        this.logger.debug(`updateProxiesNextRefreshTs(): proxiesIds.length=${update.proxiesIds.length} / nextRefreshTs=${update.nextRefreshTs}`);

        await this.storage.updateProxiesNextRefreshTs(
            update.proxiesIds,
            update.nextRefreshTs
        );
    }

    //////////// FREE PROXIES ////////////
    @EventPattern(MESSAGE_FREEPROXIES_CREATE)
    async createFreeproxies(create: IFreeproxiesToCreate): Promise<void> {
        this.logger.debug(`createFreeproxies(): create.freeproxies.length=${create.freeproxies.length}`);

        await this.storage.createFreeproxies(create);

        const event: IEvent = {
            id: create.projectId,
            scope: EEventScope.FREEPROXIES,
            event: new FreeproxiesCreatedEvent(create.freeproxies),
        };

        await lastValueFrom(this.proxy.emit(
            MESSAGE_EVENTS,
            [
                event,
            ]
        ));
    }

    @EventPattern(MESSAGE_FREEPROXIES_SYNC)
    async synchronizeFreeproxies(actions: ISynchronizeFreeproxies): Promise<void> {
        this.logger.debug(`synchronizeFreeproxies(): updated.length=${actions.updated.length} / removed.length=${actions.removed.length}`);

        await this.storage.synchronizeFreeproxies(actions);

        const actionsByProjects = new Map<string, ISynchronizeFreeproxies>();

        // Update
        for (const freeproxy of actions.updated) {
            let actionsByProject = actionsByProjects.get(freeproxy.projectId);

            if (actionsByProject) {
                actionsByProject.updated.push(freeproxy);
            } else {
                actionsByProject = {
                    updated: [
                        freeproxy,
                    ],
                    removed: [],
                };

                actionsByProjects.set(
                    freeproxy.projectId,
                    actionsByProject
                );
            }
        }

        // Remove
        for (const freeproxy of actions.removed) {
            let actionsByProject = actionsByProjects.get(freeproxy.projectId);

            if (actionsByProject) {
                actionsByProject.removed.push(freeproxy);
            } else {
                actionsByProject = {
                    updated: [],
                    removed: [
                        freeproxy,
                    ],
                };

                actionsByProjects.set(
                    freeproxy.projectId,
                    actionsByProject
                );
            }
        }

        // Events
        if (actionsByProjects.size > 0) {
            const events: IEvent[] = [];
            for (const [
                projectId, actionsByProject,
            ] of actionsByProjects.entries()) {
                events.push({
                    id: projectId,
                    scope: EEventScope.FREEPROXIES,
                    event: new FreeproxiesSynchronizedEvent(actionsByProject),
                });
            }
            await lastValueFrom(this.proxy.emit(
                MESSAGE_EVENTS,
                events
            ));
        }
    }

    @EventPattern(MESSAGE_FREEPROXIES_UPDATE_NEXT_REFRESH)
    async updateFreeproxiesNextRefreshTs(update: IFreeproxiesNextRefreshToUpdate): Promise<void> {
        this.logger.debug(`updateFreeproxiesNextRefreshTs(): freeproxiesIds.length=${update.freeproxiesIds.length} / nextRefreshTs=${update.nextRefreshTs}`);

        await this.storage.updateFreeproxiesNextRefreshTs(
            update.freeproxiesIds,
            update.nextRefreshTs
        );
    }

    @EventPattern(MESSAGE_SOURCES_CREATE)
    async createSources(sources: ISource[]): Promise<void> {
        this.logger.debug(`createSources(): sources.length=${sources.length}`);

        await this.storage.createSources(sources);

        const sourcesByProjects = new Map<string, ISource[]>();
        for (const source of sources) {
            let sourcesByProject = sourcesByProjects.get(source.projectId);

            if (sourcesByProject) {
                sourcesByProject.push(source);
            } else {
                sourcesByProject = [
                    source,
                ];

                sourcesByProjects.set(
                    source.projectId,
                    sourcesByProject
                );
            }
        }

        // Events
        if (sourcesByProjects.size > 0) {
            const events: IEvent[] = [];
            for (const [
                projectId, sourcesByProject,
            ] of sourcesByProjects.entries()) {
                events.push({
                    id: projectId,
                    scope: EEventScope.FREEPROXIES,
                    event: new SourcesCreatedEvent(sourcesByProject),
                });
            }
            await lastValueFrom(this.proxy.emit(
                MESSAGE_EVENTS,
                events
            ));
        }
    }

    @EventPattern(MESSAGE_SOURCES_REMOVED)
    async removeSources(sources: ISource[]): Promise<void> {
        this.logger.debug(`removeSources(): sources.length=${sources.length}`);

        await this.storage.removeSources(sources);

        const sourcesByProjects = new Map<string, ISource[]>();

        for (const source of sources) {
            let sourcesByProject = sourcesByProjects.get(source.projectId);

            if (sourcesByProject) {
                sourcesByProject.push(source);
            } else {
                sourcesByProject = [
                    source,
                ];

                sourcesByProjects.set(
                    source.projectId,
                    sourcesByProject
                );
            }
        }

        // Events
        if (sourcesByProjects.size > 0) {
            const events: IEvent[] = [];
            for (const [
                projectId, sourcesByProject,
            ] of sourcesByProjects.entries()) {
                events.push({
                    id: projectId,
                    scope: EEventScope.FREEPROXIES,
                    event: new SourcesRemovedEvent(sourcesByProject),
                });
            }
            await lastValueFrom(this.proxy.emit(
                MESSAGE_EVENTS,
                events
            ));
        }
    }

    @EventPattern(MESSAGE_SOURCE_UPDATE_NEXT_REFRESH)
    async updateSourceNextRefreshTs(update: ISourceNextRefreshToUpdate): Promise<void> {
        this.logger.debug(`updateSourceNextRefreshTs(): projectId=${update.projectId} / connectorId=${update.connectorId} / sourceId=${update.sourceId} / nextRefreshTs=${update.nextRefreshTs}`);

        await this.storage.updateSourceNextRefreshTs(
            update.projectId,
            update.connectorId,
            update.sourceId,
            update.nextRefreshTs
        );
    }

    //////////// TASKS ////////////
    @EventPattern(MESSAGE_TASKS_CREATE)
    async createTasks(task: ITaskData): Promise<void> {
        this.logger.debug(`createTask(): task.id=${task.id}`);

        await this.storage.createTask(task);

        const event: IEvent = {
            id: task.projectId,
            scope: EEventScope.PROJECT,
            event: new TaskCreatedEvent(toTaskView(task)),
        };

        await lastValueFrom(this.proxy.emit(
            MESSAGE_EVENTS,
            [
                event,
            ]
        ));
    }

    @EventPattern(MESSAGE_TASKS_UPDATE)
    async updateTask(task: ITaskData): Promise<void> {
        this.logger.debug(`updateTask(): task.id=${task.id}`);

        await this.storage.updateTask(task);

        const event: IEvent = {
            id: task.projectId,
            scope: EEventScope.PROJECT,
            event: new TaskUpdatedEvent(toTaskView(task)),

        };

        await lastValueFrom(this.proxy.emit(
            MESSAGE_EVENTS,
            [
                event,
            ]
        ));
    }

    @EventPattern(MESSAGE_TASKS_REMOVE)
    async removeTask(task: ITaskData): Promise<void> {
        this.logger.debug(`removeTask(): task.id=${task.id}`);

        await this.storage.removeTask(task);

        const event: IEvent = {
            id: task.projectId,
            scope: EEventScope.PROJECT,
            event: new TaskRemovedEvent(toTaskView(task)),

        };

        await lastValueFrom(this.proxy.emit(
            MESSAGE_EVENTS,
            [
                event,
            ]
        ));
    }

    @EventPattern(MESSAGE_TASKS_LOCK)
    async lockTask(update: ITaskToLock): Promise<void> {
        this.logger.debug(`lockTask(): projectId=${update.projectId} / taskId=${update.taskId}`);

        await this.storage.lockTask(
            update.projectId,
            update.taskId
        );
    }

    //////////// CERTIFICATES ////////////
    @EventPattern(MESSAGE_CERTIFICATE_CREATE)
    async createCertificateForHostname(update: ICertificateToCreate): Promise<void> {
        this.logger.debug(`createCertificateForHostname(): hostname=${update.hostname}}`);

        await this.storage.createCertificateForHostname(
            update.hostname,
            update.certificate
        );
    }

    //////////// MISC ////////////
    async onModuleInit() {
        await this.proxy.connect();

        const client = (this.proxy as any).client as IAmqpConnectionManager;
        client.addListener(
            'connect',
            () => {
                this.alive = true;
            }
        );
        client.addListener(
            'disconnect',
            () => {
                this.alive = false;
            }
        );

        this.alive = true;
    }
}
