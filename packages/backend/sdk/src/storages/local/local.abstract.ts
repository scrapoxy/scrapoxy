import { Logger } from '@nestjs/common';
import {
    addRange,
    CONNECTOR_FREEPROXIES_TYPE,
    ConnectorCreatedEvent,
    ConnectorRemovedEvent,
    ConnectorUpdatedEvent,
    CredentialCreatedEvent,
    CredentialRemovedEvent,
    CredentialUpdatedEvent,
    EEventScope,
    EProxyStatus,
    formatProxyId,
    FreeproxiesCreatedEvent,
    FreeproxiesSynchronizedEvent,
    generateUseragent,
    isProxyOnline,
    ProjectMetricsAddedEvent,
    ProjectRemovedEvent,
    ProjectUpdatedEvent,
    ProjectUserAddedEvent,
    ProjectUserRemovedEvent,
    ProxiesMetricsAddedEvent,
    ProxiesSynchronizedEvent,
    PROXY_TIMEOUT_DISCONNECTED_DEFAULT_TEST,
    PROXY_TIMEOUT_UNREACHABLE_DEFAULT,
    SourcesCreatedEvent,
    SourcesRemovedEvent,
    SourcesUpdatedEvent,
    TaskCreatedEvent,
    TaskRemovedEvent,
    TaskUpdatedEvent,
    toConnectorData,
    toConnectorView,
    toCredentialData,
    toCredentialView,
    toOptionalValue,
    toProjectData,
    toProjectView,
    toProxyData,
    toSynchronizeLocalProxiesBase,
    toTaskData,
    toTaskView,
    toUserData,
    toUserProject,
    toUserView,
    UserUpdatedEvent,
    WINDOWS_CONFIG,
} from '@scrapoxy/common';
import { v4 as uuid } from 'uuid';
import {
    toConnectorProxiesSync,
    toConnectorProxiesView,
} from './connector.model';
import {
    toFreeproxy,
    toFreeproxyToRefresh,
} from './freeproxy.model';
import {
    toProjectMetricsView,
    toProjectSync,
} from './project.model';
import {
    toProxyToConnect,
    toProxyToRefresh,
} from './proxy.model';
import { toSource } from './source.model';
import {
    CertificateNotFoundError,
    ConnectorNameAlreadyExistsError,
    ConnectorNotFoundError,
    CredentialNameAlreadyExistsError,
    CredentialNotFoundError,
    FreeproxiesNotFoundError,
    InconsistencyDataError,
    NoConnectorToRefreshError,
    NoFreeproxyToRefreshError,
    NoProjectProxyError,
    NoProxyToRefreshError,
    NoSourceToRefreshError,
    NoTaskToRefreshError,
    ParamNotFoundError,
    ProjectNameAlreadyExistsError,
    ProjectNotFoundError,
    ProjectTokenNotFoundError,
    ProxiesNotFoundError,
    ProxyNotFoundError,
    SourceNotFoundError,
    TaskNotFoundError,
    UserEmailAlreadyExistsError,
    UserNotFoundByEmailError,
    UserNotFoundError,
} from '../../errors';
import { EventsService } from '../../events';
import type { IConnectorModel } from './connector.model';
import type { ICredentialModel } from './credential.model';
import type { IFreeproxyModel } from './freeproxy.model';
import type { IStorageLocalModuleConfig } from './local.interface';
import type { IProjectModel } from './project.model';
import type { IProxyModel } from './proxy.model';
import type { ISourceModel } from './source.model';
import type { ITaskModel } from './task.model';
import type { IUserModel } from './user.model';
import type { IProxyTest } from '../../datacenter-local';
import type { IProbeService } from '../../probe/providers/providers.interface';
import type { IStorageService } from '../providers.interface';
import type {
    ICertificate,
    ICertificateInfo,
    IConnectorData,
    IConnectorDataToCreate,
    IConnectorFreeproxyConfig,
    IConnectorProxiesSync,
    IConnectorProxiesView,
    IConnectorToRefresh,
    ICredentialData,
    ICredentialView,
    IEvent,
    IFreeproxy,
    IFreeproxyToRefresh,
    IProjectData,
    IProjectDataCreate,
    IProjectMetricsAddView,
    IProjectMetricsView,
    IProjectSync,
    IProjectUserLink,
    IProjectView,
    IProxyData,
    IProxyMetricsAdd,
    IProxyToConnect,
    IProxyToRefresh,
    ISource,
    ISynchronizeFreeproxies,
    ISynchronizeLocalProxiesData,
    ITaskData,
    ITaskView,
    IUserData,
    IUserProject,
    IWindow,
} from '@scrapoxy/common';


export abstract class AStorageLocal<C extends IStorageLocalModuleConfig> implements IStorageService, IProbeService {
    abstract type: string;

    abstract alive: boolean;

    protected readonly certificates = new Map<string, ICertificate>();

    protected readonly freeproxies = new Map<string, IFreeproxyModel>();

    protected readonly params = new Map<string, string>();

    protected readonly projects = new Map<string, IProjectModel>();

    protected readonly projectsByName = new Map<string, IProjectModel>();

    protected readonly projectsToken = new Map<string, IProjectModel>();

    protected readonly proxies = new Map<string, IProxyModel>();

    protected readonly sources = new Map<string, ISourceModel>();

    protected readonly users = new Map<string, IUserModel>();

    protected readonly usersByEmail = new Map<string, IUserModel>();

    private readonly logger = new Logger(AStorageLocal.name);

    constructor(
        protected readonly config: C,
        private readonly events: EventsService
    ) {}

    initProxies(
        projectId: string,
        connectorId: string,
        proxies: IProxyTest[]
    ) {
        this.logger.debug(`initProxies(): projectId=${projectId} / connectorId=${connectorId} / proxies.length=${proxies.length}`);

        const projectFound = this.projects.get(projectId);

        if (!projectFound) {
            throw new ProjectNotFoundError(projectId);
        }

        const connectorFound = projectFound.connectors.get(connectorId);

        if (!connectorFound) {
            throw new ConnectorNotFoundError(
                projectFound.id,
                connectorId
            );
        }

        connectorFound.proxies.clear();

        const nowTime = Date.now();
        for (const proxy of proxies) {
            const id = formatProxyId(
                connectorId,
                proxy.key
            );
            const proxyModel: IProxyModel = {
                ...proxy,
                id,
                connectorId: connectorId,
                projectId,
                type: connectorFound.type,
                key: proxy.key,
                name: proxy.key,
                config: void 0,
                removing: false,
                removingForce: false,
                fingerprint: null,
                fingerprintError: null,
                createdTs: nowTime,
                useragent: generateUseragent(),
                timeoutDisconnected: PROXY_TIMEOUT_DISCONNECTED_DEFAULT_TEST,
                timeoutUnreachable: PROXY_TIMEOUT_UNREACHABLE_DEFAULT,
                disconnectedTs: null,
                requests: 0,
                bytesReceived: 0,
                bytesSent: 0,
                nextRefreshTs: 0,
                lastConnectionTs: 0,
                autoRotateDelayFactor: Math.random(),
            };

            this.proxies.set(
                proxyModel.id,
                proxyModel
            );

            connectorFound.proxies.set(
                proxyModel.id,
                proxyModel
            );
        }
    }

    //////////// USERS ////////////
    async getUserById(userId: string): Promise<IUserData> {
        this.logger.debug(`getUserById(): userId=${userId}`);

        const userModel = this.users.get(userId);

        if (!userModel) {
            throw new UserNotFoundError(userId);
        }

        return toUserData(userModel);
    }

    async getUserByEmail(email: string): Promise<IUserData> {
        this.logger.debug(`getUserByEmail(): email=${email}`);

        const userModel = this.usersByEmail.get(email);

        if (!userModel) {
            throw new UserNotFoundByEmailError(email);
        }

        return toUserData(userModel);
    }

    async checkIfUserEmailExists(
        email: string, userId?: string
    ): Promise<void> {
        this.logger.debug(`checkIfUserEmailExists(): email=${email} / userId=${userId}`);

        const userModel = this.usersByEmail.get(email);

        if (!userModel) {
            return;
        }

        if (!userId || userModel.id !== userId) {
            throw new UserEmailAlreadyExistsError(email);
        }
    }

    async createUser(user: IUserData): Promise<void> {
        this.logger.debug(`createUser(): user.id=${user.id}`);

        const userModel: IUserModel = {
            ...user,
            projectsIds: new Set(),
        };

        this.users.set(
            user.id,
            userModel
        );

        if (user.email && user.email.length > 0) {
            this.usersByEmail.set(
                user.email,
                userModel
            );
        }
    }

    async updateUser(user: IUserData): Promise<void> {
        this.logger.debug(`updateUser(): user.id=${user.id}`);

        const userModel = this.users.get(user.id);

        if (!userModel) {
            throw new UserNotFoundError(user.id);
        }

        if (user.email &&
            user.email.length > 0 &&
            userModel.email !== user.email) {

            if (userModel.email && userModel.email.length > 0) {
                this.usersByEmail.delete(userModel.email);
            }
            this.usersByEmail.set(
                user.email,
                userModel
            );
        }

        userModel.name = user.name;
        userModel.email = user.email;
        userModel.picture = user.picture;
        userModel.complete = user.complete;

        const event: IEvent = {
            id: userModel.id,
            scope: EEventScope.USER,
            event: new UserUpdatedEvent(toUserView(user)),
        };

        await this.events.emit(event);
    }

    //////////// PROJECTS ////////////
    async getAllProjectsForUserId(userId: string): Promise<IProjectView[]> {
        this.logger.debug(`getAllProjectsForUserId(): userId=${userId}`);

        const userModel = this.users.get(userId);

        if (!userModel) {
            return [];
        }

        const projects: IProjectView[] = [];
        for (const projectId of userModel.projectsIds) {
            const projectModel = this.projects.get(projectId);

            if (projectModel) {
                projects.push(toProjectView(projectModel));
            }
        }

        return projects;
    }

    async getAllProjectsMetrics(): Promise<IProjectMetricsView[]> {
        this.logger.debug('getAllProjectMetrics()');

        return Array.from(this.projects.values())
            .map(toProjectMetricsView);
    }

    async getProjectById(projectId: string): Promise<IProjectData> {
        this.logger.debug(`getProjectById(): projectId=${projectId}`);

        const projectModel = this.projects.get(projectId);

        if (!projectModel) {
            throw new ProjectNotFoundError(projectId);
        }

        return toProjectData(projectModel);
    }

    async getProjectSyncById(projectId: string): Promise<IProjectSync> {
        this.logger.debug(`getProjectSyncById(): projectId=${projectId}`);

        const projectModel = this.projects.get(projectId);

        if (!projectModel) {
            throw new ProjectNotFoundError(projectId);
        }

        return toProjectSync(projectModel);
    }

    async getProjectByToken(token: string): Promise<IProjectData> {
        this.logger.debug(`getProjectByToken(): token=${token}`);

        const projectModel = this.projectsToken.get(token);

        if (!projectModel) {
            throw new ProjectTokenNotFoundError(token);
        }

        return toProjectData(projectModel);
    }

    async getProjectMetricsById(projectId: string): Promise<IProjectMetricsView> {
        this.logger.debug(`getProjectMetricsById(): projectId=${projectId}`);

        const projectModel = this.projects.get(projectId);

        if (!projectModel) {
            throw new ProjectNotFoundError(projectId);
        }

        return toProjectMetricsView(projectModel);
    }

    async getProjectTokenById(projectId: string): Promise<string> {
        this.logger.debug(`getProjectTokenById(): projectId=${projectId}`);

        const projectModel = this.projects.get(projectId);

        if (!projectModel) {
            throw new ProjectNotFoundError(projectId);
        }

        return projectModel.token;
    }

    async getProjectIdByToken(token: string): Promise<string> {
        this.logger.debug(`getProjectIdByToken(): token=${token}`);

        const projectModel = this.projectsToken.get(token);

        if (!projectModel) {
            throw new ProjectNotFoundError(token);
        }

        return projectModel.id;
    }

    async getProjectConnectorsCountById(projectId: string): Promise<number> {
        this.logger.debug(`getProjectConnectorsCountById(): projectId=${projectId}`);

        const projectModel = this.projects.get(projectId);

        if (!projectModel) {
            throw new ProjectNotFoundError(projectId);
        }

        return projectModel.connectors.size;
    }

    async checkIfProjectNameExists(
        name: string, projectId?: string
    ): Promise<void> {
        this.logger.debug(`checkIfProjectNameExists(): name=${name} / projectId=${projectId}`);

        const projectModel = this.projectsByName.get(name);

        if (!projectModel) {
            return;
        }

        if (!projectId || projectModel.id !== projectId) {
            throw new ProjectNameAlreadyExistsError(name);
        }
    }

    async createProject(create: IProjectDataCreate): Promise<void> {
        this.logger.debug(`createProject(): create.userId=${create.userId}, create.project.name=${create.project.name}`);

        const userModel = this.users.get(create.userId);

        if (!userModel) {
            throw new UserNotFoundError(create.userId);
        }

        // Windows
        const windows = new Map<string, IWindow>();
        for (const c of WINDOWS_CONFIG) {
            const window: IWindow = {
                id: uuid(),
                projectId: create.project.id,
                delay: c.delay,
                size: c.size,
                count: 0,
                requests: 0,
                stops: 0,
                bytesReceived: 0,
                bytesSent: 0,
                snapshots: [],
            };

            windows.set(
                window.id,
                window
            );
        }

        const projectModel: IProjectModel = {
            id: create.project.id,
            name: create.project.name,
            status: create.project.status,
            connectorDefaultId: create.project.connectorDefaultId,
            token: create.token,
            autoRotate: create.project.autoRotate,
            autoScaleUp: create.project.autoScaleUp,
            autoScaleDown: create.project.autoScaleDown,
            cookieSession: create.project.cookieSession,
            mitm: create.project.mitm,
            proxiesMin: create.project.proxiesMin,
            useragentOverride: create.project.useragentOverride,
            requests: 0,
            stops: 0,
            proxiesCreated: 0,
            proxiesRemoved: 0,
            bytesReceived: 0,
            bytesReceivedRate: 0,
            bytesSent: 0,
            bytesSentRate: 0,
            requestsBeforeStop: {
                sum: 0,
                count: 0,
                min: void 0,
                max: void 0,
            },
            uptimeBeforeStop: {
                sum: 0,
                count: 0,
                min: void 0,
                max: void 0,
            },
            snapshot: {
                requests: 0,
                stops: 0,
                bytesReceived: 0,
                bytesSent: 0,
            },
            credentials: new Map<string, ICredentialModel>(),
            connectors: new Map<string, IConnectorModel>(),
            windows,
            tasks: new Map<string, ITaskModel>(),
            usersIds: new Set<string>([
                userModel.id,
            ]),
            lastDataTs: Date.now(),
        };

        this.projects.set(
            projectModel.id,
            projectModel
        );

        this.projectsByName.set(
            projectModel.name,
            projectModel
        );

        this.projectsToken.set(
            projectModel.token,
            projectModel
        );

        userModel.projectsIds.add(projectModel.id);
    }

    async updateProject(project: IProjectData): Promise<void> {
        this.logger.debug(`updateProject(): project.id=${project.id}`);

        const projectModel = this.projects.get(project.id);

        if (!projectModel) {
            throw new ProjectNotFoundError(project.id);
        }

        if (projectModel.name !== project.name) {
            this.projectsByName.delete(projectModel.name);
            this.projectsByName.set(
                project.name,
                projectModel
            );
        }

        projectModel.name = project.name;
        projectModel.autoRotate = project.autoRotate;
        projectModel.autoScaleUp = project.autoScaleUp;
        projectModel.autoScaleDown = project.autoScaleDown;
        projectModel.cookieSession = project.cookieSession;
        projectModel.mitm = project.mitm;
        projectModel.proxiesMin = project.proxiesMin;
        projectModel.useragentOverride = project.useragentOverride;
        projectModel.status = project.status;
        projectModel.connectorDefaultId = project.connectorDefaultId;

        const event: IEvent = {
            id: projectModel.id,
            scope: EEventScope.PROJECT,
            event: new ProjectUpdatedEvent(project),
        };

        await this.events.emit(event);
    }

    async updateProjectLastDataTs(
        projectId: string, lastDataTs: number
    ): Promise<void> {
        this.logger.debug(`updateProjectLastDataTs(): projectId=${projectId} / lastDataTs=${lastDataTs}`);

        const projectModel = this.projects.get(projectId);

        if (!projectModel) {
            throw new ProjectNotFoundError(projectId);
        }

        projectModel.lastDataTs = lastDataTs;
    }

    async removeProject(project: IProjectData): Promise<void> {
        this.logger.debug(`updateProject(): project.id=${project.id}`);

        const projectModel = this.projects.get(project.id);

        if (!projectModel) {
            throw new ProjectNotFoundError(project.id);
        }

        this.projects.delete(projectModel.id);

        this.projectsByName.delete(projectModel.name);

        this.projectsToken.delete(projectModel.token);

        const event: IEvent = {
            id: project.id,
            scope: EEventScope.PROJECT,
            event: new ProjectRemovedEvent(project),

        };

        await this.events.emit(event);
    }

    async getAllProjectUsersById(projectId: string): Promise<IUserProject[]> {
        this.logger.debug(`getAllProjectUsersById():projectId=${projectId}`);

        const projectModel = this.projects.get(projectId);

        if (!projectModel) {
            throw new ProjectNotFoundError(projectId);
        }

        const users = Array.from(projectModel.usersIds)
            .map((id) => this.users.get(id) as IUserModel)
            .map(toUserProject);

        return users;
    }

    async canUserAccessToProject(
        projectId: string,
        userId: string
    ): Promise<boolean> {
        this.logger.debug(`canUserAccessToProject(): projectId=${projectId} / userId=${userId}`);

        const projectModel = this.projects.get(projectId);

        if (!projectModel) {
            return false;
        }

        return projectModel.usersIds.has(userId);
    }

    async addUserToProject(link: IProjectUserLink): Promise<void> {
        this.logger.debug(`addUserToProject(): link.projectId=${link.projectId} / link.userId=${link.userId}`);

        const projectModel = this.projects.get(link.projectId);

        if (!projectModel) {
            throw new ProjectNotFoundError(link.projectId);
        }

        const userModel = this.users.get(link.userId);

        if (!userModel) {
            throw new UserNotFoundError(link.userId);
        }

        userModel.projectsIds.add(link.projectId);
        projectModel.usersIds.add(link.userId);

        const event: IEvent = {
            id: projectModel.id,
            scope: EEventScope.PROJECT,
            event: new ProjectUserAddedEvent(link),
        };

        await this.events.emit(event);
    }

    async removeUserFromProject(link: IProjectUserLink): Promise<void> {
        this.logger.debug(`removeUserFromProject(): link.projectId=${link.projectId} / link.userId=${link.userId}`);

        const projectModel = this.projects.get(link.projectId);

        if (!projectModel) {
            throw new ProjectNotFoundError(link.projectId);
        }

        const userModel = this.users.get(link.userId);

        if (!userModel) {
            throw new UserNotFoundError(link.userId);
        }

        userModel.projectsIds.delete(link.projectId);
        projectModel.usersIds.delete(link.userId);

        const event: IEvent = {
            id: projectModel.id,
            scope: EEventScope.PROJECT,
            event: new ProjectUserRemovedEvent(link),
        };

        await this.events.emit(event);
    }

    async addProjectsMetrics(views: IProjectMetricsAddView[]): Promise<void> {
        this.logger.debug(`addProjectsMetrics(): views.length=${views.length}`);

        for (const view of views) {
            const projectModel = this.projects.get(view.project.id);

            if (projectModel) {
                if (view.project.requests) {
                    projectModel.requests += view.project.requests;
                }

                if (view.project.stops) {
                    projectModel.stops += view.project.stops;
                }

                if (view.project.proxiesCreated) {
                    projectModel.proxiesCreated += view.project.proxiesCreated;
                }

                if (view.project.proxiesRemoved) {
                    projectModel.proxiesRemoved += view.project.proxiesRemoved;
                }

                if (view.project.bytesReceived) {
                    projectModel.bytesReceived += view.project.bytesReceived;
                    projectModel.bytesReceivedRate = view.project.bytesReceived;
                }

                if (view.project.bytesSent) {
                    projectModel.bytesSent += view.project.bytesSent;
                    projectModel.bytesSentRate = view.project.bytesSent;
                }

                if (view.project.snapshot) {
                    projectModel.snapshot.requests += view.project.snapshot.requests;
                    projectModel.snapshot.stops += view.project.snapshot.stops;
                    projectModel.snapshot.bytesReceived += view.project.snapshot.bytesReceived;
                    projectModel.snapshot.bytesSent += view.project.snapshot.bytesSent;
                }

                if (view.project.requestsBeforeStop) {
                    addRange(
                        projectModel.requestsBeforeStop,
                        view.project.requestsBeforeStop
                    );
                }

                if (view.project.uptimeBeforeStop) {
                    addRange(
                        projectModel.uptimeBeforeStop,
                        view.project.uptimeBeforeStop
                    );
                }

                if (view.windows) {
                    for (const window of view.windows) {
                        const windowModel = projectModel.windows.get(window.id);

                        if (!windowModel) {
                            throw new InconsistencyDataError(`Cannot window ${window.id} for project ${view.project.id}`);
                        }

                        windowModel.count += window.count;
                        windowModel.requests += window.requests;
                        windowModel.stops += window.stops;
                        windowModel.bytesReceived += window.bytesReceived;
                        windowModel.bytesSent += window.bytesSent;

                        if (window.snapshot) {
                            windowModel.snapshots.push(window.snapshot);

                            while (windowModel.snapshots.length > window.size) {
                                windowModel.snapshots.shift();
                            }
                        }
                    }
                }

                const event: IEvent = {
                    id: view.project.id,
                    scope: EEventScope.METRICS,
                    event: new ProjectMetricsAddedEvent(view),
                };

                await this.events.emit(event);
            }
        }
    }

    async updateProjectToken(
        projectId: string, token: string
    ): Promise<void> {
        this.logger.debug(`updateProjectToken(): projectId=${projectId}`);

        const projectModel = this.projects.get(projectId);

        if (!projectModel) {
            throw new ProjectNotFoundError(projectId);
        }

        this.projectsToken.delete(projectModel.token);

        projectModel.token = token;

        this.projectsToken.set(
            projectModel.token,
            projectModel
        );
    }

    //////////// CREDENTIALS ////////////
    async getAllProjectCredentials(
        projectId: string, type: string | null
    ): Promise<ICredentialView[]> {
        this.logger.debug(`getAllProjectCredentials(): projectId=${projectId} / type=${type}`);

        const projectModel = this.projects.get(projectId);

        if (!projectModel) {
            throw new ProjectNotFoundError(projectId);
        }

        if (type) {
            return Array.from(projectModel.credentials.values())
                .filter((c) => c.type === type)
                .map(toCredentialView);
        } else {
            return Array.from(projectModel.credentials.values())
                .map(toCredentialView);
        }
    }

    async getCredentialById(
        projectId: string, credentialId: string
    ): Promise<ICredentialData> {
        this.logger.debug(`getCredentialById(): projectId=${projectId} / credentialId=${credentialId}`);

        const projectModel = this.projects.get(projectId);

        if (!projectModel) {
            throw new ProjectNotFoundError(projectId);
        }

        const credentialModel = projectModel.credentials.get(credentialId);

        if (!credentialModel) {
            throw new CredentialNotFoundError(
                projectModel.id,
                credentialId
            );
        }

        return toCredentialData(credentialModel);
    }

    async getCredentialConnectorsCountById(
        projectId: string, credentialId: string, active: boolean
    ): Promise<number> {
        this.logger.debug(`getCredentialConnectorsCountById(): projectId=${projectId} / credentialId=${credentialId} / active=${active}`);

        const projectModel = this.projects.get(projectId);

        if (!projectModel) {
            throw new ProjectNotFoundError(projectId);
        }

        if (active) {
            return Array.from(projectModel.connectors.values())
                .filter((c) => c.credentialId === credentialId && c.active === active).length;
        } else {
            return Array.from(projectModel.connectors.values())
                .filter((c) => c.credentialId === credentialId).length;
        }

    }

    async checkIfCredentialNameExists(
        projectId: string, name: string, credentialId?: string
    ): Promise<void> {
        this.logger.debug(`checkIfCredentialNameExists(): projectId=${projectId} / name=${name} / credentialId=${credentialId}`);

        const projectModel = this.projects.get(projectId);

        if (!projectModel) {
            throw new ProjectNotFoundError(projectId);
        }

        if (credentialId) {
            for (const credentialModel of projectModel.credentials.values()) {
                if (credentialModel.name === name && credentialModel.id !== credentialId) {
                    throw new CredentialNameAlreadyExistsError(
                        projectId,
                        name
                    );
                }
            }
        } else {
            for (const credentialModel of projectModel.credentials.values()) {
                if (credentialModel.name === name) {
                    throw new CredentialNameAlreadyExistsError(
                        projectId,
                        name
                    );
                }
            }
        }
    }

    async createCredential(credential: ICredentialData): Promise<void> {
        this.logger.debug(`createCredential(): credential.id=${credential.id}`);

        const projectModel = this.projects.get(credential.projectId);

        if (!projectModel) {
            throw new ProjectNotFoundError(credential.projectId);
        }

        const credentialModel: ICredentialModel = {
            ...credential,
        };

        projectModel.credentials.set(
            credentialModel.id,
            credentialModel
        );

        const event: IEvent = {
            id: credential.projectId,
            scope: EEventScope.PROJECT,
            event: new CredentialCreatedEvent(toCredentialView(credential)),
        };

        await this.events.emit(event);
    }

    async updateCredential(credential: ICredentialData): Promise<void> {
        this.logger.debug(`updateCredential(): credential.id=${credential.id}`);

        const projectModel = this.projects.get(credential.projectId);

        if (!projectModel) {
            throw new ProjectNotFoundError(credential.projectId);
        }

        const credentialModel = projectModel.credentials.get(credential.id);

        if (!credentialModel) {
            throw new CredentialNotFoundError(
                projectModel.id,
                credential.id
            );
        }

        credentialModel.name = credential.name;
        credentialModel.config = credential.config;

        const event: IEvent = {
            id: credential.projectId,
            scope: EEventScope.PROJECT,
            event: new CredentialUpdatedEvent(toCredentialView(credential)),

        };

        await this.events.emit(event);
    }

    async removeCredential(credential: ICredentialData): Promise<void> {
        this.logger.debug(`removeCredential(): credential.id=${credential.id}`);

        const projectModel = this.projects.get(credential.projectId);

        if (!projectModel) {
            throw new ProjectNotFoundError(credential.projectId);
        }

        const credentialModel = projectModel.credentials.get(credential.id);

        if (!credentialModel) {
            throw new CredentialNotFoundError(
                projectModel.id,
                credential.id
            );
        }

        projectModel.credentials.delete(credentialModel.id);

        const event: IEvent = {
            id: credential.projectId,
            scope: EEventScope.PROJECT,
            event: new CredentialRemovedEvent(toCredentialView(credential)),

        };

        await this.events.emit(event);
    }

    //////////// CONNECTORS ////////////
    async getAllProjectConnectorsAndProxiesById(projectId: string): Promise<IConnectorProxiesView[]> {
        this.logger.debug(`getAllProjectConnectorsAndProxiesById(): projectId=${projectId}`);

        const projectModel = this.projects.get(projectId);

        if (!projectModel) {
            throw new ProjectNotFoundError(projectId);
        }

        return Array.from(projectModel.connectors.values())
            .map(toConnectorProxiesView);
    }

    async getAllConnectorProxiesById(
        projectId: string, connectorId: string
    ): Promise<IConnectorProxiesView> {
        this.logger.debug(`getAllConnectorProxiesById(): projectId=${projectId} / connectorId=${connectorId}`);

        const projectModel = this.projects.get(projectId);

        if (!projectModel) {
            throw new ProjectNotFoundError(projectId);
        }

        const connectorModel = projectModel.connectors.get(connectorId);

        if (!connectorModel) {
            throw new ConnectorNotFoundError(
                projectModel.id,
                connectorId
            );
        }

        return toConnectorProxiesView(connectorModel);
    }

    async getAllConnectorProxiesSyncById(
        projectId: string, connectorId: string
    ): Promise<IConnectorProxiesSync> {
        this.logger.debug(`getAllConnectorProxiesSyncById(): projectId=${projectId} / connectorId=${connectorId}`);

        const projectModel = this.projects.get(projectId);

        if (!projectModel) {
            throw new ProjectNotFoundError(projectId);
        }

        const connectorModel = projectModel.connectors.get(connectorId);

        if (!connectorModel) {
            throw new ConnectorNotFoundError(
                projectModel.id,
                connectorId
            );
        }

        return toConnectorProxiesSync(connectorModel);
    }

    async getConnectorById(
        projectId: string, connectorId: string
    ): Promise<IConnectorData> {
        this.logger.debug(`getConnectorById(): projectId=${projectId} / connectorId=${connectorId}`);

        const projectModel = this.projects.get(projectId);

        if (!projectModel) {
            throw new ProjectNotFoundError(projectId);
        }

        const connectorModel = projectModel.connectors.get(connectorId);

        if (!connectorModel) {
            throw new ConnectorNotFoundError(
                projectId,
                connectorId
            );
        }

        return toConnectorData(connectorModel);
    }

    async getAnotherConnectorById(
        projectId: string, excludeConnectorId: string
    ): Promise<string | null> {
        this.logger.debug(`getAnotherConnectorById(): projectId=${projectId} / excludeConnectorId=${excludeConnectorId}`);

        const projectModel = this.projects.get(projectId);

        if (!projectModel) {
            throw new ProjectNotFoundError(projectId);
        }

        const anotherId = Array.from(projectModel.connectors.keys())
            .find((id) => id !== excludeConnectorId) ?? null;

        return anotherId;
    }

    async getConnectorCertificateById(
        projectId: string, connectorId: string
    ): Promise<ICertificate | null> {
        this.logger.debug(`getConnectorCertificateById(): projectId=${projectId} / connectorId=${connectorId}`);

        const projectModel = this.projects.get(projectId);

        if (!projectModel) {
            throw new ProjectNotFoundError(projectId);
        }

        const connectorModel = projectModel.connectors.get(connectorId);

        if (!connectorModel) {
            throw new ConnectorNotFoundError(
                projectId,
                connectorId
            );
        }

        return connectorModel.certificate;
    }

    async checkIfConnectorNameExists(
        projectId: string, name: string, connectorId?: string
    ): Promise<void> {
        this.logger.debug(`checkIfConnectorNameExists(): projectId=${projectId} / name=${name} / connectorId=${connectorId}`);

        const projectModel = this.projects.get(projectId);

        if (!projectModel) {
            throw new ProjectNotFoundError(projectId);
        }

        if (connectorId) {
            for (const connectorModel of projectModel.connectors.values()) {
                if (connectorModel.name === name && connectorModel.id !== connectorId) {
                    throw new ConnectorNameAlreadyExistsError(
                        projectId,
                        name
                    );
                }
            }
        } else {
            for (const connectorModel of projectModel.connectors.values()) {
                if (connectorModel.name === name) {
                    throw new ConnectorNameAlreadyExistsError(
                        projectId,
                        name
                    );
                }
            }
        }
    }

    async createConnector(connector: IConnectorDataToCreate): Promise<void> {
        this.logger.debug(`createConnector(): connector.id=${connector.id}`);

        const projectModel = this.projects.get(connector.projectId);

        if (!projectModel) {
            throw new ProjectNotFoundError(connector.projectId);
        }

        const connectorModel: IConnectorModel = {
            ...connector,
            nextRefreshTs: Date.now(),
            proxies: new Map<string, IProxyModel>(),
            freeproxies: new Map<string, IFreeproxyModel>(),
            sources: new Map<string, ISourceModel>(),
        };

        projectModel.connectors.set(
            connectorModel.id,
            connectorModel
        );

        const event: IEvent = {
            id: connector.projectId,
            scope: EEventScope.PROJECT,
            event: new ConnectorCreatedEvent(toConnectorView(connector)),
        };

        await this.events.emit(event);
    }

    async updateConnector(connector: IConnectorData): Promise<void> {
        this.logger.debug(`updateConnector(): connector.id=${connector.id}`);

        const projectModel = this.projects.get(connector.projectId);

        if (!projectModel) {
            throw new ProjectNotFoundError(connector.projectId);
        }

        const connectorModel = projectModel.connectors.get(connector.id);

        if (!connectorModel) {
            throw new ConnectorNotFoundError(
                projectModel.id,
                connector.id
            );
        }

        connectorModel.name = connector.name;
        connectorModel.active = connector.active;
        connectorModel.proxiesMax = connector.proxiesMax;
        connectorModel.proxiesTimeoutDisconnected = connector.proxiesTimeoutDisconnected;
        connectorModel.proxiesTimeoutUnreachable = connector.proxiesTimeoutUnreachable;
        connectorModel.error = connector.error;
        connectorModel.certificateEndAt = connector.certificateEndAt;
        connectorModel.credentialId = connector.credentialId;
        connectorModel.config = connector.config;

        const proxyTimeoutUnreachable = toOptionalValue(connector.proxiesTimeoutUnreachable);
        for (const proxy of connectorModel.proxies.values()) {
            proxy.timeoutDisconnected = connector.proxiesTimeoutDisconnected;
            proxy.timeoutUnreachable = proxyTimeoutUnreachable;
        }

        if (connector.type === CONNECTOR_FREEPROXIES_TYPE) {
            const config = connector.config as IConnectorFreeproxyConfig;
            const freeproxyTimeoutUnreachable = toOptionalValue(config.freeproxiesTimeoutUnreachable);
            for (const freeproxy of connectorModel.freeproxies.values()) {
                freeproxy.timeoutDisconnected = config.freeproxiesTimeoutDisconnected;
                freeproxy.timeoutUnreachable = freeproxyTimeoutUnreachable;
            }
        }

        const event: IEvent = {
            id: connector.projectId,
            scope: EEventScope.PROJECT,
            event: new ConnectorUpdatedEvent(toConnectorView(connector)),

        };

        await this.events.emit(event);
    }

    async updateConnectorCertificate(
        projectId: string,
        connectorId: string,
        certificateInfo: ICertificateInfo
    ): Promise<void> {
        this.logger.debug(`updateConnectorCertificate(): projectId=${projectId} / connectorId=${connectorId}`);

        const projectModel = this.projects.get(projectId);

        if (!projectModel) {
            throw new ProjectNotFoundError(projectId);
        }

        const connectorModel = projectModel.connectors.get(connectorId);

        if (!connectorModel) {
            throw new ConnectorNotFoundError(
                projectModel.id,
                connectorId
            );
        }

        connectorModel.certificate = certificateInfo.certificate;
        connectorModel.certificateEndAt = certificateInfo.endAt;

        const event: IEvent = {
            id: projectId,
            scope: EEventScope.PROJECT,
            event: new ConnectorUpdatedEvent(toConnectorView(connectorModel)),

        };

        await this.events.emit(event);
    }

    async removeConnector(connector: IConnectorData): Promise<void> {
        this.logger.debug(`removeConnector(): connector.id=${connector.id}`);

        const projectModel = this.projects.get(connector.projectId);

        if (!projectModel) {
            throw new ProjectNotFoundError(connector.projectId);
        }

        const connectorModel = projectModel.connectors.get(connector.id);

        if (!connectorModel) {
            throw new ConnectorNotFoundError(
                projectModel.id,
                connector.id
            );
        }

        for (const proxy of connectorModel.proxies.values()) {
            this.proxies.delete(proxy.id);
        }

        for (const source of connectorModel.sources.values()) {
            this.sources.delete(source.id);
        }

        for (const freeproxy of connectorModel.freeproxies.values()) {
            this.freeproxies.delete(freeproxy.id);
        }

        projectModel.connectors.delete(connectorModel.id);

        const event: IEvent = {
            id: connector.projectId,
            scope: EEventScope.PROJECT,
            event: new ConnectorRemovedEvent(toConnectorView(connector)),

        };

        await this.events.emit(event);
    }

    async getNextConnectorToRefresh(nextRefreshTs: number): Promise<IConnectorToRefresh> {
        this.logger.debug(`getNextConnectorToRefresh(): nextRefreshTs=${nextRefreshTs}`);

        const connectorsModel: IConnectorModel[] = [];
        for (const project of this.projects.values()) {
            for (const connector of project.connectors.values()) {
                if (connector.nextRefreshTs < nextRefreshTs) {
                    connectorsModel.push(connector);
                }
            }
        }

        if (connectorsModel.length <= 0) {
            throw new NoConnectorToRefreshError();
        }

        connectorsModel.sort((
            a, b
        ) => a.nextRefreshTs - b.nextRefreshTs);

        const connectorModel = connectorsModel[ 0 ];
        const projectModel = this.projects.get(connectorModel.projectId);

        if (!projectModel) {
            throw new ProjectNotFoundError(connectorModel.projectId);
        }

        const credentialModel = projectModel.credentials.get(connectorModel.credentialId);

        if (!credentialModel) {
            throw new CredentialNotFoundError(
                projectModel.id,
                connectorModel.credentialId
            );
        }

        const proxiesKeys = Array.from(connectorModel.proxies.values())
            .map((p) => p.key);
        const refresh: IConnectorToRefresh = {
            id: connectorModel.id,
            name: connectorModel.name,
            projectId: connectorModel.projectId,
            type: connectorModel.type,
            error: connectorModel.error,
            credentialConfig: credentialModel.config,
            connectorConfig: connectorModel.config,
            certificate: connectorModel.certificate,
            proxiesKeys,
        };

        return refresh;
    }

    async updateConnectorNextRefreshTs(
        projectId: string, connectorId: string, nextRefreshTs: number
    ): Promise<void> {
        this.logger.debug(`updateConnectorNextRefreshTs(): projectId=${projectId} / connectorId=${connectorId} / nextRefreshTs=${nextRefreshTs}`);

        const projectModel = this.projects.get(projectId);

        if (!projectModel) {
            throw new ProjectNotFoundError(projectId);
        }

        const connectorModel = projectModel.connectors.get(connectorId);

        if (!connectorModel) {
            throw new ConnectorNotFoundError(
                projectId,
                connectorId
            );
        }

        connectorModel.nextRefreshTs = nextRefreshTs;
    }

    //////////// PROXIES ////////////
    async getProxiesByIds(proxiesIds: string[]): Promise<IProxyData[]> {
        this.logger.debug(`getProxiesByIds(): proxiesIds.length=${proxiesIds.length}`);

        const proxies: IProxyData[] = [];
        for (const id of proxiesIds) {
            const proxy = this.proxies.get(id);

            if (proxy) {
                proxies.push(proxy);
            }
        }

        return proxies;
    }

    async getProjectProxiesByIds(
        projectId: string, proxiesIds: string[], removing?: boolean
    ): Promise<IProxyData[]> {
        this.logger.debug(`getProjectProxiesByIds(): projectId=${projectId} / proxiesIds.length=${proxiesIds.length} / removing=${removing}`);

        const projectModel = this.projects.get(projectId);

        if (!projectModel) {
            throw new ProjectNotFoundError(projectId);
        }

        const proxies: IProxyData[] = [];
        for (const id of proxiesIds) {
            const proxyModel = this.proxies.get(id);

            if (proxyModel && proxyModel.projectId === projectId) {
                if (removing === false || removing === true) {
                    if (proxyModel.removing === removing) {
                        proxies.push(toProxyData(proxyModel));
                    }
                } else {
                    proxies.push(toProxyData(proxyModel));
                }

            }
        }

        return proxies;
    }

    async getConnectorProxiesCountById(
        projectId: string, connectorId: string
    ): Promise<number> {
        this.logger.debug(`getConnectorProxiesCountById(): projectId=${projectId} / connectorId=${connectorId}`);

        const projectModel = this.projects.get(projectId);

        if (!projectModel) {
            throw new ProjectNotFoundError(projectId);
        }

        const connectorModel = projectModel.connectors.get(connectorId);

        if (!connectorModel) {
            throw new ConnectorNotFoundError(
                projectModel.id,
                connectorId
            );
        }

        return connectorModel.proxies.size;
    }

    async getProxiesCount(): Promise<number> {
        this.logger.debug('getProxiesCount()');

        return this.proxies.size;
    }

    async synchronizeProxies(actions: ISynchronizeLocalProxiesData): Promise<void> {
        this.logger.debug(`synchronizeProxies(): created.length=${actions.created.length} / updated.length=${actions.updated.length} / removed.length=${actions.removed.length}`);

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

            const projectModel = this.projects.get(proxy.projectId);

            if (projectModel) {
                const connectorModel = projectModel.connectors.get(proxy.connectorId);

                if (connectorModel) {
                    const proxyModel: IProxyModel = {
                        ...proxy,
                        requests: 0,
                        bytesSent: 0,
                        bytesReceived: 0,
                        nextRefreshTs: 0,
                        lastConnectionTs: 0,
                    };

                    this.logger.debug(`synchronizeProxies: create proxy ${proxyModel.id}`);

                    connectorModel.proxies.set(
                        proxyModel.id,
                        proxyModel
                    );
                    this.proxies.set(
                        proxyModel.id,
                        proxyModel
                    );
                }
            }
        }

        for (const proxy of actions.updated) {
            const proxyModel = this.proxies.get(proxy.id);

            if (proxyModel) {
                this.logger.debug(`synchronizeProxies: update proxy ${proxyModel.id}`);

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

                proxyModel.status = proxy.status;
                proxyModel.config = proxy.config;
                proxyModel.removing = proxy.removing;
                proxyModel.removingForce = proxy.removingForce;
                proxyModel.fingerprint = proxy.fingerprint;
                proxyModel.fingerprintError = proxy.fingerprintError;
                proxyModel.disconnectedTs = proxy.disconnectedTs;
            }
        }

        for (const proxy of actions.removed) {
            const proxyModel = this.proxies.get(proxy.id);

            if (proxyModel) {
                this.logger.debug(`synchronizeProxies: remove proxy ${proxyModel.id}`);

                let actionsByProject = actionsByProjects.get(proxyModel.projectId);

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
                        proxyModel.projectId,
                        actionsByProject
                    );
                }

                const projectModel = this.projects.get(proxyModel.projectId);

                if (projectModel) {
                    const connectorModel = projectModel.connectors.get(proxyModel.connectorId);

                    if (connectorModel) {
                        connectorModel.proxies.delete(proxyModel.id);
                    }
                }

                this.proxies.delete(proxyModel.id);
            }
        }

        // Build event by project
        if (actionsByProjects.size > 0) {
            const promises: Promise<void>[] = [];
            for (const [
                projectId, actionsByProject,
            ] of actionsByProjects.entries()) {
                const event: IEvent = {
                    id: projectId,
                    scope: EEventScope.PROXIES,
                    event: new ProxiesSynchronizedEvent(toSynchronizeLocalProxiesBase(actionsByProject)),
                };

                promises.push(this.events.emit(event));
            }

            await Promise.all(promises);
        }
    }

    async addProxiesMetrics(proxies: IProxyMetricsAdd[]): Promise<void> {
        this.logger.debug(`addProxiesMetrics(): proxies.length=${proxies.length}`);

        const
            metricsByProjects = new Map<string, IProxyMetricsAdd[]>(),
            nowTime = Date.now();

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

            const projectModel = this.projects.get(proxy.projectId);

            if (projectModel) {
                projectModel.snapshot.requests += proxy.requests;
                projectModel.snapshot.bytesReceived += proxy.bytesReceived;
                projectModel.snapshot.bytesSent += proxy.bytesSent;

                projectModel.lastDataTs = nowTime;
            }

            const proxyModel = this.proxies.get(proxy.id);

            if (proxyModel) {
                proxyModel.requests += proxy.requests;
                proxyModel.bytesReceived += proxy.bytesReceived;
                proxyModel.bytesSent += proxy.bytesSent;
            }
        }

        // Build event by project
        if (metricsByProjects.size > 0) {
            const promises: Promise<void>[] = [];
            for (const [
                projectId, proxiesByProject,
            ] of metricsByProjects.entries()) {
                const event: IEvent = {
                    id: projectId,
                    scope: EEventScope.PROXIES,
                    event: new ProxiesMetricsAddedEvent(proxiesByProject),
                };

                promises.push(this.events.emit(event));
            }
            await Promise.all(promises);
        }
    }

    async getNextProxyToConnect(
        projectId: string,
        proxyname: string | null
    ): Promise<IProxyToConnect> {
        this.logger.debug(`getNextProxyToConnect(): projectId=${projectId} / proxyname=${proxyname}`);

        const projectModel = this.projects.get(projectId);

        if (!projectModel) {
            throw new ProjectNotFoundError(projectId);
        }

        let proxyModel: IProxyModel | undefined = void 0;

        if (proxyname) {
            const proxy = this.proxies.get(proxyname);

            if (proxy && proxy.projectId === projectModel.id) {
                proxyModel = proxy;
            }
        } else {
            const proxiesModel: IProxyModel[] = [];
            for (const proxy of this.proxies.values()) {
                if (proxy.projectId === projectModel.id &&
                    isProxyOnline(proxy)) {
                    proxiesModel.push(proxy);
                }
            }

            if (proxiesModel.length > 0) {
                proxiesModel.sort((
                    a, b
                ) => a.lastConnectionTs - b.lastConnectionTs);

                proxyModel = proxiesModel[ 0 ];
            }
        }

        if (!proxyModel) {
            throw new NoProjectProxyError(projectId);
        }

        return toProxyToConnect(proxyModel);
    }

    async updateProxyLastConnectionTs(
        projectId: string, connectorId: string, proxyId: string, lastConnectionTs: number
    ): Promise<void> {
        this.logger.debug(`updateProxyLastConnectionTs(): projectId=${projectId} / connectorId=${connectorId} / proxyId=${proxyId} / lastConnectionTs=${lastConnectionTs}`);

        const proxyModel = this.proxies.get(proxyId);

        if (!proxyModel) {
            throw new ProxyNotFoundError(
                projectId,
                connectorId,
                proxyId
            );
        }

        proxyModel.lastConnectionTs = lastConnectionTs;
    }

    async getNextProxiesToRefresh(
        nextRefreshTs: number, count: number
    ): Promise<IProxyToRefresh[]> {
        this.logger.debug(`getNextProxiesToRefresh(): nextRefreshTs=${nextRefreshTs} / count=${count}`);

        const proxies: IProxyModel[] = Array.from(this.proxies.values())
            .filter((p) =>
                p.status === EProxyStatus.STARTED &&
                p.nextRefreshTs < nextRefreshTs);

        if (proxies.length <= 0) {
            throw new NoProxyToRefreshError();
        }

        proxies.sort((
            a, b
        ) => a.nextRefreshTs - b.nextRefreshTs);

        const proxiesToRefresh = proxies
            .slice(
                0,
                count
            )
            .map(toProxyToRefresh);

        return proxiesToRefresh;
    }

    async updateProxiesNextRefreshTs(
        proxiesIds: string[], nextRefreshTs: number
    ): Promise<void> {
        this.logger.debug(`updateProxiesNextRefreshTs(): proxiesIds.length=${proxiesIds.length} / nextRefreshTs=${nextRefreshTs}`);

        const idsNotFound: string[] = [];
        for (const id of proxiesIds) {
            const proxyModel = this.proxies.get(id);

            if (proxyModel) {
                proxyModel.nextRefreshTs = nextRefreshTs + proxyModel.timeoutDisconnected;
            } else {
                idsNotFound.push(id);
            }
        }

        if (idsNotFound.length > 0) {
            throw new ProxiesNotFoundError(idsNotFound);
        }
    }

    //////////// FREE PROXIES ////////////
    async getFreeproxiesByIds(freeproxiesIds: string[]): Promise<IFreeproxy[]> {
        this.logger.debug(`getFreeproxiesByIds(): freeproxiesIds.length=${freeproxiesIds.length}`);

        const freeproxies: IFreeproxy[] = [];
        for (const freeproxyModel of this.freeproxies.values()) {
            if (freeproxiesIds.includes(freeproxyModel.id)) {
                freeproxies.push(toFreeproxy(freeproxyModel));
            }
        }

        return freeproxies;
    }

    async getAllProjectFreeproxiesById(
        projectId: string, connectorId: string
    ): Promise<IFreeproxy[]> {
        this.logger.debug(`getAllProjectFreeproxiesById(): projectId=${projectId} / connectorId=${connectorId}`);

        const projectModel = this.projects.get(projectId);

        if (!projectModel) {
            throw new ProjectNotFoundError(projectId);
        }

        const connectorModel = projectModel.connectors.get(connectorId);

        if (!connectorModel) {
            throw new ConnectorNotFoundError(
                projectModel.id,
                connectorId
            );
        }

        return Array.from(connectorModel.freeproxies.values())
            .map(toFreeproxy);
    }

    async getSelectedProjectFreeproxies(
        projectId: string, connectorId: string, keys: string[]
    ): Promise<IFreeproxy[]> {
        this.logger.debug(`getSelectedProjectFreeproxies(): projectId=${projectId} / connectorId=${connectorId} / keys.length=${keys.length}`);

        const projectModel = this.projects.get(projectId);

        if (!projectModel) {
            throw new ProjectNotFoundError(projectId);
        }

        const connectorModel = projectModel.connectors.get(connectorId);

        if (!connectorModel) {
            throw new ConnectorNotFoundError(
                projectModel.id,
                connectorId
            );
        }

        return Array.from(connectorModel.freeproxies.values())
            .filter((f) => keys.includes(f.key))
            .map(toFreeproxy);
    }

    async getNewProjectFreeproxies(
        projectId: string, connectorId: string, count: number, excludeKeys: string[]
    ): Promise<IFreeproxy[]> {
        this.logger.debug(`getNewProjectFreeproxies(): projectId=${projectId} / connectorId=${connectorId} / count=${count} / excludeKeys.length=${excludeKeys.length}`);

        const projectModel = this.projects.get(projectId);

        if (!projectModel) {
            throw new ProjectNotFoundError(projectId);
        }

        const connectorModel = projectModel.connectors.get(connectorId);

        if (!connectorModel) {
            throw new ConnectorNotFoundError(
                projectModel.id,
                connectorId
            );
        }

        return Array.from(connectorModel.freeproxies.values())
            .filter((f) => !excludeKeys.includes(f.key) && !!f.fingerprint)
            .slice(
                0,
                count
            )
            .map(toFreeproxy);
    }

    async createFreeproxies(
        projectId: string,
        connectorId: string,
        freeproxies: IFreeproxy[]
    ): Promise<void> {
        this.logger.debug(`createFreeproxies(): projectId=${projectId} / connectorId=${connectorId} / freeproxies.length=${freeproxies.length}`);

        const projectModel = this.projects.get(projectId);

        if (!projectModel) {
            throw new ProjectNotFoundError(projectId);
        }

        const connectorModel = projectModel.connectors.get(connectorId);

        if (!connectorModel) {
            throw new ConnectorNotFoundError(
                projectId,
                connectorId
            );
        }

        const freeproxiesCreated: IFreeproxy[] = [];
        for (const freeproxy of freeproxies) {
            if (freeproxy.projectId !== projectId ||
                freeproxy.connectorId !== connectorId) {
                continue;
            }

            const freeproxyModel: IFreeproxyModel = {
                ...freeproxy,
                nextRefreshTs: 0,
            };

            connectorModel.freeproxies.set(
                freeproxyModel.id,
                freeproxyModel
            );

            this.freeproxies.set(
                freeproxyModel.id,
                freeproxyModel
            );

            freeproxiesCreated.push(toFreeproxy(freeproxyModel));
        }

        const event: IEvent = {
            id: projectId,
            scope: EEventScope.FREEPROXIES,
            event: new FreeproxiesCreatedEvent(freeproxiesCreated),
        };

        await this.events.emit(event);
    }

    async synchronizeFreeproxies(actions: ISynchronizeFreeproxies): Promise<void> {
        this.logger.debug(`synchronizeFreeproxies(): updated.length=${actions.updated.length} / removed.length=${actions.removed.length}`);

        const actionsByProjects = new Map<string, ISynchronizeFreeproxies>();

        // Update
        for (const freeproxy of actions.updated) {
            const freeproxyFound = this.freeproxies.get(freeproxy.id);

            if (!freeproxyFound) {
                continue;
            }

            freeproxyFound.disconnectedTs = freeproxy.disconnectedTs;
            freeproxyFound.fingerprint = freeproxy.fingerprint;
            freeproxyFound.fingerprintError = freeproxy.fingerprintError;

            let actionsByProject = actionsByProjects.get(freeproxyFound.projectId);

            if (actionsByProject) {
                actionsByProject.updated.push(freeproxyFound);
            } else {
                actionsByProject = {
                    updated: [
                        freeproxyFound,
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
            const freeproxyFound = this.freeproxies.get(freeproxy.id);

            if (!freeproxyFound) {
                continue;
            }

            const projectFound = this.projects.get(freeproxyFound.projectId);

            if (projectFound) {
                const connectorFound = projectFound.connectors.get(freeproxyFound.connectorId);

                if (connectorFound) {
                    connectorFound.freeproxies.delete(freeproxyFound.id);
                }
            }

            this.freeproxies.delete(freeproxy.id);

            let actionsByProject = actionsByProjects.get(freeproxyFound.projectId);

            if (actionsByProject) {
                actionsByProject.removed.push(freeproxyFound);
            } else {
                actionsByProject = {
                    updated: [],
                    removed: [
                        freeproxyFound,
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
            const promises: Promise<void>[] = [];
            for (const [
                projectId, actionsByProject,
            ] of actionsByProjects.entries()) {
                const event: IEvent = {
                    id: projectId,
                    scope: EEventScope.FREEPROXIES,
                    event: new FreeproxiesSynchronizedEvent(actionsByProject),
                };

                promises.push(this.events.emit(event));
            }

            await Promise.all(promises);
        }
    }

    async getNextFreeproxiesToRefresh(
        nextRefreshTs: number, count: number
    ): Promise<IFreeproxyToRefresh[]> {
        this.logger.debug(`getNextFreeproxiesToRefresh(): nextRefreshTs=${nextRefreshTs} / count=${count}`);

        const freeproxies: IFreeproxyModel[] = Array.from(this.freeproxies.values())
            .filter((p) => p.nextRefreshTs < nextRefreshTs);

        if (freeproxies.length <= 0) {
            throw new NoFreeproxyToRefreshError();
        }

        freeproxies.sort((
            a, b
        ) => a.nextRefreshTs - b.nextRefreshTs);

        const freeproxiesToRefresh = freeproxies
            .slice(
                0,
                count
            )
            .map(toFreeproxyToRefresh);

        return freeproxiesToRefresh;
    }

    async updateFreeproxiesNextRefreshTs(
        freeproxiesIds: string[], nextRefreshTs: number
    ): Promise<void> {
        this.logger.debug(`updateFreeproxiesNextRefreshTs(): freeproxiesIds.length=${freeproxiesIds.length} / nextRefreshTs=${nextRefreshTs}`);

        const idsNotFound: string[] = [];
        for (const id of freeproxiesIds) {
            const freeproxyModel = this.freeproxies.get(id);

            if (freeproxyModel) {
                freeproxyModel.nextRefreshTs = nextRefreshTs + freeproxyModel.timeoutDisconnected;
            } else {
                idsNotFound.push(id);
            }
        }

        if (idsNotFound.length > 0) {
            throw new FreeproxiesNotFoundError(idsNotFound);
        }
    }

    async getAllProjectSourcesById(
        projectId: string, connectorId: string
    ): Promise<ISource[]> {
        this.logger.debug(`getAllProjectSourcesById(): projectId=${projectId} / connectorId=${connectorId}`);

        const projectModel = this.projects.get(projectId);

        if (!projectModel) {
            throw new ProjectNotFoundError(projectId);
        }

        const connectorModel = projectModel.connectors.get(connectorId);

        if (!connectorModel) {
            throw new ConnectorNotFoundError(
                projectModel.id,
                connectorId
            );
        }

        return Array.from(connectorModel.sources.values())
            .map(toSource);
    }

    async getSourceById(
        projectId: string, connectorId: string, sourceId: string
    ): Promise<ISource> {
        this.logger.debug(`getSourceById(): projectId=${projectId} / connectorId=${connectorId} / sourceId=${sourceId}`);

        const projectModel = this.projects.get(projectId);

        if (!projectModel) {
            throw new ProjectNotFoundError(projectId);
        }

        const connectorModel = projectModel.connectors.get(connectorId);

        if (!connectorModel) {
            throw new ConnectorNotFoundError(
                projectModel.id,
                connectorId
            );
        }

        const sourceModel = connectorModel.sources.get(sourceId);

        if (!sourceModel) {
            throw new SourceNotFoundError(
                projectModel.id,
                connectorId,
                sourceId
            );
        }

        return toSource(sourceModel);
    }

    async createSources(sources: ISource[]): Promise<void> {
        this.logger.debug(`createSources(): sources.length=${sources.length}`);

        const sourcesByProjects = new Map<string, ISource[]>();
        for (const source of sources) {
            const projectModel = this.projects.get(source.projectId);

            if (!projectModel) {
                throw new ProjectNotFoundError(source.projectId);
            }

            const connectorModel = projectModel.connectors.get(source.connectorId);

            if (!connectorModel) {
                throw new ConnectorNotFoundError(
                    source.projectId,
                    source.connectorId
                );
            }

            const sourceModel: ISourceModel = {
                ...source,
                nextRefreshTs: 0,
            };

            connectorModel.sources.set(
                sourceModel.id,
                sourceModel
            );

            this.sources.set(
                sourceModel.id,
                sourceModel
            );

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
        for (const [
            projectId, sourcesByProject,
        ] of sourcesByProjects.entries()) {
            const event: IEvent = {
                id: projectId,
                scope: EEventScope.FREEPROXIES,
                event: new SourcesCreatedEvent(sourcesByProject),
            };

            await this.events.emit(event);
        }
    }

    async updateSources(sources: ISource[]): Promise<void> {
        this.logger.debug(`updateSources(): sources.length=${sources.length}`);

        const sourcesByProjects = new Map<string, ISource[]>();
        for (const source of sources) {
            const sourceModel = this.sources.get(source.id);

            if (!sourceModel) {
                throw new SourceNotFoundError(
                    source.projectId,
                    source.connectorId,
                    source.id
                );
            }

            sourceModel.url = source.url;
            sourceModel.delay = source.delay;
            sourceModel.lastRefreshTs = source.lastRefreshTs;
            sourceModel.lastRefreshError = source.lastRefreshError;

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

        if (sourcesByProjects.size > 0) {
            for (const [
                projectId, sourcesByProject,
            ] of sourcesByProjects.entries()) {
                const event: IEvent = {
                    id: projectId,
                    scope: EEventScope.FREEPROXIES,
                    event: new SourcesUpdatedEvent(sourcesByProject),
                };

                await this.events.emit(event);
            }
        }
    }

    async removeSources(sources: ISource[]): Promise<void> {
        this.logger.debug(`removeSources(): sources.length=${sources.length}`);

        const sourcesByProjects = new Map<string, ISource[]>();
        for (const source of sources) {
            const projectModel = this.projects.get(source.projectId);

            if (!projectModel) {
                throw new ProjectNotFoundError(source.projectId);
            }

            const connectorModel = projectModel.connectors.get(source.connectorId);

            if (!connectorModel) {
                throw new ConnectorNotFoundError(
                    source.projectId,
                    source.connectorId
                );
            }

            connectorModel.sources.delete(source.id);
            this.sources.delete(source.id);

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
            for (const [
                projectId, sourcesByProject,
            ] of sourcesByProjects.entries()) {
                const event: IEvent = {
                    id: projectId,
                    scope: EEventScope.FREEPROXIES,
                    event: new SourcesRemovedEvent(sourcesByProject),
                };

                await this.events.emit(event);
            }
        }
    }

    async getNextSourceToRefresh(nextRefreshTs: number): Promise<ISource> {
        this.logger.debug(`getNextSourceToRefresh(): nextRetryTs=${nextRefreshTs}`);

        const sourcesModel = Array.from(this.sources.values())
            .filter((s) => s.nextRefreshTs < nextRefreshTs);

        if (sourcesModel.length <= 0) {
            throw new NoSourceToRefreshError();
        }

        sourcesModel.sort((
            a, b
        ) => a.nextRefreshTs - b.nextRefreshTs);

        const sourceModel = sourcesModel[ 0 ];

        return toSource(sourceModel);
    }

    async updateSourceNextRefreshTs(
        projectId: string,
        connectorId: string,
        sourceId: string,
        nextRefreshTs: number
    ): Promise<void> {
        this.logger.debug(`updateSourceNextRefreshTs(): projectId=${projectId} / connectorId=${connectorId} / sourceId=${sourceId} / nextRefreshTs=${nextRefreshTs}`);

        const projectModel = this.projects.get(projectId);

        if (!projectModel) {
            throw new ProjectNotFoundError(projectId);
        }

        const connectorModel = projectModel.connectors.get(connectorId);

        if (!connectorModel) {
            throw new ConnectorNotFoundError(
                projectId,
                connectorId
            );
        }

        const sourceModel = connectorModel.sources.get(sourceId);

        if (!sourceModel) {
            throw new SourceNotFoundError(
                projectId,
                connectorId,
                sourceId
            );
        }

        sourceModel.nextRefreshTs = nextRefreshTs;
    }

    //////////// TASKS ////////////
    async getAllProjectTasksById(projectId: string): Promise<ITaskView[]> {
        this.logger.debug(`getAllProjectTasksById(): projectId=${projectId}`);

        const projectModel = this.projects.get(projectId);

        if (!projectModel) {
            throw new ProjectNotFoundError(projectId);
        }


        return Array.from(projectModel.tasks.values())
            .map(toTaskView);
    }

    async getTaskById(
        projectId: string, taskId: string
    ): Promise<ITaskData> {
        this.logger.debug(`getTaskById(): projectId=${projectId} / taskId=${taskId}`);

        const projectModel = this.projects.get(projectId);

        if (!projectModel) {
            throw new ProjectNotFoundError(projectId);
        }

        const taskModel = projectModel.tasks.get(taskId);

        if (!taskModel) {
            throw new TaskNotFoundError(
                projectModel.id,
                taskId
            );
        }

        return toTaskData(taskModel);
    }

    async createTask(task: ITaskData): Promise<void> {
        this.logger.debug(`createTask(): task.id=${task.id}`);

        const projectModel = this.projects.get(task.projectId);

        if (!projectModel) {
            throw new ProjectNotFoundError(task.projectId);
        }

        const connectorModel = projectModel.connectors.get(task.connectorId);

        if (!connectorModel) {
            throw new ConnectorNotFoundError(
                projectModel.id,
                task.connectorId
            );
        }

        const taskModel: ITaskModel = {
            ...task,
            locked: false,
        };

        projectModel.tasks.set(
            taskModel.id,
            taskModel
        );

        const event: IEvent = {
            id: task.projectId,
            scope: EEventScope.PROJECT,
            event: new TaskCreatedEvent(toTaskView(task)),
        };

        await this.events.emit(event);
    }

    async updateTask(task: ITaskData): Promise<void> {
        this.logger.debug(`updateTask(): task.id=${task.id}`);

        const projectModel = this.projects.get(task.projectId);

        if (!projectModel) {
            throw new ProjectNotFoundError(task.projectId);
        }

        const taskModel = projectModel.tasks.get(task.id);

        if (!taskModel) {
            throw new TaskNotFoundError(
                projectModel.id,
                task.id
            );
        }

        taskModel.running = task.running;
        taskModel.cancelled = task.cancelled;
        taskModel.stepCurrent = task.stepCurrent;
        taskModel.message = task.message;
        taskModel.endAtTs = task.endAtTs;
        taskModel.nextRetryTs = task.nextRetryTs;
        taskModel.data = task.data;
        taskModel.locked = false;

        const event: IEvent = {
            id: task.projectId,
            scope: EEventScope.PROJECT,
            event: new TaskUpdatedEvent(toTaskView(task)),

        };

        await this.events.emit(event);
    }

    async lockTask(
        projectId: string, taskId: string
    ): Promise<void> {
        this.logger.debug(`lockTask(): projectId=${projectId} / taskId=${taskId}`);

        const project = this.projects.get(projectId);

        if (!project) {
            throw new ProjectNotFoundError(projectId);
        }

        const task = project.tasks.get(taskId);

        if (!task) {
            throw new TaskNotFoundError(
                projectId,
                taskId
            );
        }

        task.locked = true;
    }

    async removeTask(task: ITaskData): Promise<void> {
        this.logger.debug(`removeTask(): task.id=${task.id}`);

        const projectModel = this.projects.get(task.projectId);

        if (!projectModel) {
            throw new ProjectNotFoundError(task.projectId);
        }

        const taskModel = projectModel.tasks.get(task.id);

        if (!taskModel) {
            throw new TaskNotFoundError(
                projectModel.id,
                task.id
            );
        }

        projectModel.tasks.delete(taskModel.id);

        const event: IEvent = {
            id: task.projectId,
            scope: EEventScope.PROJECT,
            event: new TaskRemovedEvent(toTaskView(task)),

        };

        await this.events.emit(event);
    }

    async getProjectRunningTaskCount(
        projectId: string, connectorId: string
    ): Promise<number> {
        this.logger.debug(`getProjectRunningTaskCount(): projectId=${projectId} / connectorId=${connectorId}`);

        const projectModel = this.projects.get(projectId);

        if (!projectModel) {
            throw new ProjectNotFoundError(projectId);
        }

        return Array.from(projectModel.tasks.values())
            .filter((t) => t.connectorId === connectorId && t.running)
            .length;
    }

    async getNextTaskToRefresh(nextRetryTs: number): Promise<ITaskData> {
        this.logger.debug(`getNextTaskToRefresh(): nextRetryTs=${nextRetryTs}`);

        const tasksModel: ITaskModel[] = [];
        for (const project of this.projects.values()) {
            for (const task of project.tasks.values()) {
                if (task.running &&
                    !task.locked &&
                    task.nextRetryTs < nextRetryTs) {
                    tasksModel.push(task);
                }
            }
        }

        if (tasksModel.length <= 0) {
            throw new NoTaskToRefreshError();
        }

        tasksModel.sort((
            a, b
        ) => a.nextRetryTs - b.nextRetryTs);

        const taskModel = tasksModel[ 0 ];

        return taskModel;
    }

    //////////// PARAMS ////////////
    async getParam(key: string): Promise<string> {
        this.logger.debug(`getParam(): key=${key}`);

        const value = this.params.get(key);

        if (!value) {
            throw new ParamNotFoundError(key);
        }

        return value;
    }

    //////////// CERTIFICATES ////////////
    async getCertificateForHostname(hostname: string): Promise<ICertificate> {
        this.logger.debug(`getCertificateForHostname(): hostname=${hostname}`);

        const certificate = this.certificates.get(hostname);

        if (!certificate) {
            throw new CertificateNotFoundError(hostname);
        }

        return certificate;
    }

    async createCertificateForHostname(
        hostname: string, certificate: ICertificate
    ): Promise<void> {
        this.logger.debug(`createCertificateForHostname(): hostname=${hostname}}`);

        if (this.certificates.size >= this.config.certificatesMax) {
            this.logger.debug('clear all certificates (maximum reached)');
            this.certificates.clear();
        }

        this.certificates.set(
            hostname,
            certificate
        );
    }
}
