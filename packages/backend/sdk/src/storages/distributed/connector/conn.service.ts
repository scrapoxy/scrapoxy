import {
    Inject,
    Injectable,
    Logger,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { ProbeprovidersService } from '../../../probe';
import { StorageprovidersService } from '../../providers.service';
import {
    DISTRIBUTED_SERVICE,
    MESSAGE_CERTIFICATE_CREATE,
    MESSAGE_CONNECTORS_CREATE,
    MESSAGE_CONNECTORS_REMOVE,
    MESSAGE_CONNECTORS_UPDATE,
    MESSAGE_CONNECTORS_UPDATE_CERTIFICATE,
    MESSAGE_CONNECTORS_UPDATE_NEXT_REFRESH,
    MESSAGE_CREDENTIALS_CREATE,
    MESSAGE_CREDENTIALS_REMOVE,
    MESSAGE_CREDENTIALS_UPDATE,
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
    MESSAGE_SOURCES_REMOVE,
    MESSAGE_SOURCES_UPDATE,
    MESSAGE_TASKS_CREATE,
    MESSAGE_TASKS_LOCK,
    MESSAGE_TASKS_REMOVE,
    MESSAGE_TASKS_UPDATE,
    MESSAGE_USERS_CREATE,
    MESSAGE_USERS_UPDATE,
} from '../distributed.constants';
import { StorageMongoService } from '../mongo/mongo.service';
import type { IProbeService } from '../../../probe';
import type { IStorageService } from '../../providers.interface';
import type { IAmqpConnectionManager } from '../amqp.interface';
import type { OnModuleInit } from '@nestjs/common';
import type {
    ICertificate,
    ICertificateInfo,
    ICertificateToCreate,
    IConnectorCertificateToUpdate,
    IConnectorData,
    IConnectorDataToCreate,
    IConnectorNextRefreshToUpdate,
    IConnectorProxiesSync,
    IConnectorProxiesView,
    IConnectorToRefresh,
    ICredentialData,
    ICredentialView,
    IFreeproxiesNextRefreshToUpdate,
    IFreeproxiesToCreate,
    IFreeproxy,
    IFreeproxyToRefresh,
    IProjectData,
    IProjectDataCreate,
    IProjectLastDataToUpdate,
    IProjectMetricsAddView,
    IProjectMetricsView,
    IProjectSync,
    IProjectTokenToUpdate,
    IProjectUserLink,
    IProjectView,
    IProxiesNextRefreshToUpdate,
    IProxyData,
    IProxyLastConnectionToUpdate,
    IProxyMetricsAdd,
    IProxyToConnect,
    IProxyToRefresh,
    ISource,
    ISourceNextRefreshToUpdate,
    ISynchronizeFreeproxies,
    ISynchronizeLocalProxiesData,
    ITaskData,
    ITaskToLock,
    ITaskView,
    IUserData,
    IUserProject,
} from '@scrapoxy/common';


@Injectable()
export class StorageDistributedConnService implements IStorageService, IProbeService, OnModuleInit {
    readonly type = 'distributedconn';

    alive = false;

    private readonly logger = new Logger(StorageDistributedConnService.name);

    constructor(
        @Inject(StorageMongoService)
        private readonly database: IStorageService,
        probes: ProbeprovidersService,
        provider: StorageprovidersService,
        @Inject(DISTRIBUTED_SERVICE)
        private readonly proxy: ClientProxy
    ) {
        provider.storage = this;

        probes.register(this);
    }

    //////////// USERS ////////////
    async getUserById(userId: string): Promise<IUserData> {
        this.logger.debug(`getUserById(): userId=${userId}`);

        const user = await this.database.getUserById(userId);

        return user;
    }

    async getUserByEmail(email: string): Promise<IUserData> {
        this.logger.debug(`getUserByEmail(): email=${email}`);

        const user = await this.database.getUserByEmail(email);

        return user;
    }

    async checkIfUserEmailExists(
        email: string, userId?: string
    ): Promise<void> {
        this.logger.debug(`checkIfUserEmailExists(): email=${email} / userId=${userId}`);

        await this.database.checkIfUserEmailExists(
            email,
            userId
        );
    }

    async createUser(user: IUserData): Promise<void> {
        this.logger.debug(`createUser(): user.id=${user.id}`);

        await lastValueFrom(this.proxy.emit(
            MESSAGE_USERS_CREATE,
            user
        ));
    }

    async updateUser(user: IUserData): Promise<void> {
        this.logger.debug(`updateUser(): user.id=${user.id}`);

        await lastValueFrom(this.proxy.emit(
            MESSAGE_USERS_UPDATE,
            user
        ));
    }

    //////////// PROJECTS ////////////
    async getAllProjectsForUserId(userId: string): Promise<IProjectView[]> {
        this.logger.debug(`getAllProjectsForUserId(): userId=${userId}`);

        const projects = await this.database.getAllProjectsForUserId(userId);

        return projects;
    }

    async getAllProjectsMetrics(): Promise<IProjectMetricsView[]> {
        this.logger.debug('getAllProjectMetrics()');

        const views = this.database.getAllProjectsMetrics();

        return views;
    }

    async getProjectById(projectId: string): Promise<IProjectData> {
        this.logger.debug(`getProjectById(): projectId=${projectId}`);

        const project = await this.database.getProjectById(projectId);

        return project;
    }

    async getProjectSyncById(projectId: string): Promise<IProjectSync> {
        this.logger.debug(`getProjectSyncById(): projectId=${projectId}`);

        const project = await this.database.getProjectSyncById(projectId);

        return project;
    }

    async getProjectByToken(token: string): Promise<IProjectData> {
        this.logger.debug(`getProjectByToken(): token=${token}`);

        const project = await this.database.getProjectByToken(token);

        return project;
    }

    async getProjectMetricsById(projectId: string): Promise<IProjectMetricsView> {
        this.logger.debug(`getProjectMetricsById(): projectId=${projectId}`);

        const view = await this.database.getProjectMetricsById(projectId);

        return view;
    }

    async getProjectTokenById(projectId: string): Promise<string> {
        this.logger.debug(`getProjectTokenById(): projectId=${projectId}`);

        const token = await this.database.getProjectTokenById(projectId);

        return token;
    }

    async getProjectIdByToken(token: string): Promise<string> {
        this.logger.debug(`getProjectIdByToken(): token=${token}`);

        const id = await this.database.getProjectIdByToken(token);

        return id;
    }

    async getProjectConnectorsCountById(projectId: string): Promise<number> {
        this.logger.debug(`getProjectConnectorsCountById(): projectId=${projectId}`);

        const count = await this.database.getProjectConnectorsCountById(projectId);

        return count;
    }

    async checkIfProjectNameExists(
        name: string, projectId?: string
    ): Promise<void> {
        this.logger.debug(`checkIfProjectNameExists(): name=${name} / projectId=${projectId}`);

        await this.database.checkIfProjectNameExists(
            name,
            projectId
        );
    }

    async createProject(create: IProjectDataCreate): Promise<void> {
        this.logger.debug(`createProject(): create.userId=${create.userId}, create.project.name=${create.project.name}`);

        await lastValueFrom(this.proxy.emit(
            MESSAGE_PROJECTS_CREATE,
            create
        ));
    }

    async updateProject(project: IProjectData): Promise<void> {
        this.logger.debug(`updateProject(): project.id=${project.id}`);

        await lastValueFrom(this.proxy.emit(
            MESSAGE_PROJECTS_UPDATE,
            project
        ));
    }

    async updateProjectLastDataTs(
        projectId: string, lastDataTs: number
    ): Promise<void> {
        this.logger.debug(`updateProjectLastDataTs(): projectId=${projectId} / lastDataTs=${lastDataTs}`);

        const update: IProjectLastDataToUpdate = {
            projectId,
            lastDataTs,
        };

        await lastValueFrom(this.proxy.emit(
            MESSAGE_PROJECTS_UPDATE_LAST_DATA,
            update
        ));
    }

    async removeProject(project: IProjectData): Promise<void> {
        this.logger.debug(`updateProject(): project.id=${project.id}`);

        await lastValueFrom(this.proxy.emit(
            MESSAGE_PROJECTS_REMOVE,
            project
        ));
    }

    async getAllProjectUsersById(projectId: string): Promise<IUserProject[]> {
        this.logger.debug(`getAllProjectUsersById():projectId=${projectId}`);

        const users = await this.database.getAllProjectUsersById(projectId);

        return users;
    }

    async canUserAccessToProject(
        projectId: string,
        userId: string
    ): Promise<boolean> {
        this.logger.debug(`canUserAccessToProject(): projectId=${projectId} / userId=${userId}`);

        const canAccess = await this.database.canUserAccessToProject(
            projectId,
            userId
        );

        return canAccess;
    }

    async addUserToProject(link: IProjectUserLink): Promise<void> {
        this.logger.debug(`addUserToProject(): link.projectId=${link.projectId} / link.userId=${link.userId}`);

        await lastValueFrom(this.proxy.emit(
            MESSAGE_PROJECTS_ADD_USER,
            link
        ));
    }

    async removeUserFromProject(link: IProjectUserLink): Promise<void> {
        this.logger.debug(`removeUserFromProject(): link.projectId=${link.projectId} / link.userId=${link.userId}`);

        await lastValueFrom(this.proxy.emit(
            MESSAGE_PROJECTS_REMOVE_USER,
            link
        ));
    }

    async addProjectsMetrics(views: IProjectMetricsAddView[]): Promise<void> {
        this.logger.debug(`addProjectsMetrics(): views.length=${views.length}`);

        await lastValueFrom(this.proxy.emit(
            MESSAGE_PROJECTS_METRICS_ADD,
            views
        ));
    }

    async updateProjectToken(
        projectId: string, token: string
    ): Promise<void> {
        this.logger.debug(`updateProjectToken(): projectId=${projectId}`);

        const update: IProjectTokenToUpdate = {
            projectId, token,
        };

        await lastValueFrom(this.proxy.emit(
            MESSAGE_PROJECTS_TOKEN_UPDATE,
            update
        ));
    }

    //////////// CREDENTIALS ////////////
    async getAllProjectCredentials(
        projectId: string, type: string | null
    ): Promise<ICredentialView[]> {
        this.logger.debug(`getAllProjectCredentials(): projectId=${projectId} / type=${type}`);

        const credentials = await this.database.getAllProjectCredentials(
            projectId,
            type
        );

        return credentials;
    }

    async getCredentialById(
        projectId: string, credentialId: string
    ): Promise<ICredentialData> {
        this.logger.debug(`getCredentialById(): projectId=${projectId} / credentialId=${credentialId}`);

        const credential = await this.database.getCredentialById(
            projectId,
            credentialId
        );

        return credential;
    }

    async getCredentialConnectorsCountById(
        projectId: string, credentialId: string, active: boolean
    ): Promise<number> {
        this.logger.debug(`getCredentialConnectorsCountById(): projectId=${projectId} / credentialId=${credentialId} / active=${active}`);

        const count = await this.database.getCredentialConnectorsCountById(
            projectId,
            credentialId,
            active
        );

        return count;
    }

    async checkIfCredentialNameExists(
        projectId: string, name: string, credentialId?: string
    ): Promise<void> {
        this.logger.debug(`checkIfCredentialNameExists(): projectId=${projectId} / name=${name} / credentialId=${credentialId}`);

        await this.database.checkIfCredentialNameExists(
            projectId,
            name,
            credentialId
        );
    }

    async createCredential(credential: ICredentialData): Promise<void> {
        this.logger.debug(`createCredential(): credential.id=${credential.id}`);

        await lastValueFrom(this.proxy.emit(
            MESSAGE_CREDENTIALS_CREATE,
            credential
        ));
    }

    async updateCredential(credential: ICredentialData): Promise<void> {
        this.logger.debug(`updateCredential(): credential.id=${credential.id}`);

        await lastValueFrom(this.proxy.emit(
            MESSAGE_CREDENTIALS_UPDATE,
            credential
        ));
    }

    async removeCredential(credential: ICredentialData): Promise<void> {
        this.logger.debug(`removeCredential(): credential.id=${credential.id}`);

        await lastValueFrom(this.proxy.emit(
            MESSAGE_CREDENTIALS_REMOVE,
            credential
        ));
    }

    //////////// CONNECTORS ////////////
    async getAllProjectConnectorsAndProxiesById(projectId: string): Promise<IConnectorProxiesView[]> {
        this.logger.debug(`getAllProjectConnectorsAndProxiesById(): projectId=${projectId}`);

        const cps = await this.database.getAllProjectConnectorsAndProxiesById(projectId);

        return cps;
    }

    async getAllConnectorProxiesById(
        projectId: string, connectorId: string
    ): Promise<IConnectorProxiesView> {
        this.logger.debug(`getAllConnectorProxiesById(): projectId=${projectId} / connectorId=${connectorId}`);

        const cp = await this.database.getAllConnectorProxiesById(
            projectId,
            connectorId
        );

        return cp;
    }

    async getAllConnectorProxiesSyncById(
        projectId: string, connectorId: string
    ): Promise<IConnectorProxiesSync> {
        this.logger.debug(`getAllConnectorProxiesSyncById(): projectId=${projectId} / connectorId=${connectorId}`);

        const cp = await this.database.getAllConnectorProxiesSyncById(
            projectId,
            connectorId
        );

        return cp;
    }

    async getConnectorById(
        projectId: string, connectorId: string
    ): Promise<IConnectorData> {
        this.logger.debug(`getConnectorById(): projectId=${projectId} / connectorId=${connectorId}`);

        const connector = await this.database.getConnectorById(
            projectId,
            connectorId
        );

        return connector;
    }

    async getAnotherConnectorById(
        projectId: string, excludeConnectorId: string
    ): Promise<string | null> {
        this.logger.debug(`getAnotherConnectorById(): projectId=${projectId} / excludeConnectorId=${excludeConnectorId}`);

        const id = await this.database.getAnotherConnectorById(
            projectId,
            excludeConnectorId
        );

        return id;
    }

    async getConnectorCertificateById(
        projectId: string, connectorId: string
    ): Promise<ICertificate | null> {
        this.logger.debug(`getConnectorCertificateById(): projectId=${projectId} / connectorId=${connectorId}`);

        const certificate = await this.database.getConnectorCertificateById(
            projectId,
            connectorId
        );

        return certificate;
    }

    async checkIfConnectorNameExists(
        projectId: string, name: string, connectorId?: string
    ): Promise<void> {
        this.logger.debug(`checkIfConnectorNameExists(): projectId=${projectId} / name=${name} / connectorId=${connectorId}`);

        await this.database.checkIfConnectorNameExists(
            projectId,
            name,
            connectorId
        );
    }

    async createConnector(connector: IConnectorDataToCreate): Promise<void> {
        this.logger.debug(`createConnector(): connector.id=${connector.id}`);

        await lastValueFrom(this.proxy.emit(
            MESSAGE_CONNECTORS_CREATE,
            connector
        ));
    }

    async updateConnector(connector: IConnectorData): Promise<void> {
        this.logger.debug(`updateConnector(): connector.id=${connector.id}`);

        await lastValueFrom(this.proxy.emit(
            MESSAGE_CONNECTORS_UPDATE,
            connector
        ));
    }

    async updateConnectorCertificate(
        projectId: string,
        connectorId: string,
        certificateInfo: ICertificateInfo
    ): Promise<void> {
        this.logger.debug(`updateConnectorCertificate(): projectId=${projectId} / connectorId=${connectorId}`);

        const update: IConnectorCertificateToUpdate = {
            projectId,
            connectorId,
            certificateInfo,
        };

        await lastValueFrom(this.proxy.emit(
            MESSAGE_CONNECTORS_UPDATE_CERTIFICATE,
            update
        ));
    }

    async removeConnector(connector: IConnectorData): Promise<void> {
        this.logger.debug(`removeConnector(): connector.id=${connector.id}`);

        await lastValueFrom(this.proxy.emit(
            MESSAGE_CONNECTORS_REMOVE,
            connector
        ));
    }

    async getNextConnectorToRefresh(nextRefreshTs: number): Promise<IConnectorToRefresh> {
        this.logger.debug(`getNextConnectorToRefresh(): nextRefreshTs=${nextRefreshTs}`);

        const connector = await this.database.getNextConnectorToRefresh(nextRefreshTs);

        return connector;
    }

    async updateConnectorNextRefreshTs(
        projectId: string, connectorId: string, nextRefreshTs: number
    ): Promise<void> {
        this.logger.debug(`updateConnectorNextRefreshTs(): projectId=${projectId} / connectorId=${connectorId} / nextRefreshTs=${nextRefreshTs}`);

        const update: IConnectorNextRefreshToUpdate = {
            projectId,
            connectorId,
            nextRefreshTs,
        };

        await lastValueFrom(this.proxy.emit(
            MESSAGE_CONNECTORS_UPDATE_NEXT_REFRESH,
            update
        ));
    }

    //////////// PROXIES ////////////
    async getProxiesByIds(proxiesIds: string[]): Promise<IProxyData[]> {
        this.logger.debug(`getProxiesByIds(): proxiesIds.length=${proxiesIds.length}`);

        const proxies = await this.database.getProxiesByIds(proxiesIds);

        return proxies;
    }

    async getProjectProxiesByIds(
        projectId: string, proxiesIds: string[], removing?: boolean
    ): Promise<IProxyData[]> {
        this.logger.debug(`getProjectProxiesByIds(): projectId=${projectId} / proxiesIds.length=${proxiesIds.length} / removing=${removing}`);

        const proxies = await this.database.getProjectProxiesByIds(
            projectId,
            proxiesIds,
            removing
        );

        return proxies;
    }

    async getConnectorProxiesCountById(
        projectId: string, connectorId: string
    ): Promise<number> {
        this.logger.debug(`getConnectorProxiesCountById(): projectId=${projectId} / connectorId=${connectorId}`);

        const count = await this.database.getConnectorProxiesCountById(
            projectId,
            connectorId
        );

        return count;
    }

    async getProxiesCount(): Promise<number> {
        this.logger.debug('getProxiesCount()');

        const count = await this.database.getProxiesCount();

        return count;
    }

    async synchronizeProxies(actions: ISynchronizeLocalProxiesData): Promise<void> {
        this.logger.debug(`synchronizeProxies(): created.length=${actions.created.length} / updated.length=${actions.updated.length} / removed.length=${actions.removed.length}`);

        await lastValueFrom(this.proxy.emit(
            MESSAGE_PROXIES_SYNC,
            actions
        ));
    }

    async addProxiesMetrics(proxies: IProxyMetricsAdd[]): Promise<void> {
        this.logger.debug(`addProxiesMetrics(): proxies.length=${proxies.length}`);

        await lastValueFrom(this.proxy.emit(
            MESSAGE_PROXIES_METRICS_ADD,
            proxies
        ));
    }

    async getNextProxyToConnect(
        projectId: string,
        proxyname: string | null
    ): Promise<IProxyToConnect> {
        this.logger.debug(`getNextProxyToConnect(): projectId=${projectId} / proxyname=${proxyname}`);

        const proxy = await this.database.getNextProxyToConnect(
            projectId,
            proxyname
        );

        return proxy;
    }

    async updateProxyLastConnectionTs(
        projectId: string, connectorId: string, proxyId: string, lastConnectionTs: number
    ): Promise<void> {
        this.logger.debug(`updateProxyLastConnectionTs(): projectId=${projectId} / connectorId=${connectorId} / proxyId=${proxyId} / lastConnectionTs=${lastConnectionTs}`);

        const update: IProxyLastConnectionToUpdate = {
            projectId,
            connectorId: connectorId,
            proxyId,
            lastConnectionTs,
        };

        await lastValueFrom(this.proxy.emit(
            MESSAGE_PROXIES_UPDATE_LAST_CONNECTION,
            update
        ));
    }

    async getNextProxiesToRefresh(
        nextRefreshTs: number, count: number
    ): Promise<IProxyToRefresh[]> {
        this.logger.debug(`getNextProxiesToRefresh(): nextRefreshTs=${nextRefreshTs} / count=${count}`);

        const proxies = await this.database.getNextProxiesToRefresh(
            nextRefreshTs,
            count
        );

        return proxies;
    }

    async updateProxiesNextRefreshTs(
        proxiesIds: string[], nextRefreshTs: number
    ): Promise<void> {
        this.logger.debug(`updateProxiesNextRefreshTs(): proxiesIds.length=${proxiesIds.length} / nextRefreshTs=${nextRefreshTs}`);

        const update: IProxiesNextRefreshToUpdate = {
            proxiesIds,
            nextRefreshTs,
        };

        await lastValueFrom(this.proxy.emit(
            MESSAGE_PROXIES_UPDATE_NEXT_REFRESH,
            update
        ));
    }

    //////////// FREE PROXIES ////////////
    async getFreeproxiesByIds(freeproxiesIds: string[]): Promise<IFreeproxy[]> {
        this.logger.debug(`getFreeproxiesByIds(): freeproxiesIds.length=${freeproxiesIds.length}`);

        const freeproxies = await this.database.getFreeproxiesByIds(freeproxiesIds);

        return freeproxies;
    }

    async getAllProjectFreeproxiesById(
        projectId: string, connectorId: string
    ): Promise<IFreeproxy[]> {
        this.logger.debug(`getAllProjectFreeproxiesById(): projectId=${projectId} / connectorId=${connectorId}`);

        const freeproxies = await this.database.getAllProjectFreeproxiesById(
            projectId,
            connectorId
        );

        return freeproxies;
    }

    async getSelectedProjectFreeproxies(
        projectId: string, connectorId: string, keys: string[]
    ): Promise<IFreeproxy[]> {
        this.logger.debug(`getSelectedProjectFreeproxies(): projectId=${projectId} / connectorId=${connectorId} / keys.length=${keys.length}`);

        const freeproxies = await this.database.getSelectedProjectFreeproxies(
            projectId,
            connectorId,
            keys
        );

        return freeproxies;
    }

    async getNewProjectFreeproxies(
        projectId: string, connectorId: string, count: number, excludeKeys: string[]
    ): Promise<IFreeproxy[]> {
        this.logger.debug(`getNewProjectFreeproxies(): projectId=${projectId} / connectorId=${connectorId} / count=${count} / excludeKeys.length=${excludeKeys.length}`);

        const freeproxies = await this.database.getNewProjectFreeproxies(
            projectId,
            connectorId,
            count,
            excludeKeys
        );

        return freeproxies;
    }

    async createFreeproxies(
        projectId: string,
        connectorId: string,
        freeproxies: IFreeproxy[]
    ): Promise<void> {
        this.logger.debug(`createFreeproxies(): projectId=${projectId} / connectorId=${connectorId} / freeproxies.length=${freeproxies.length}`);

        const create: IFreeproxiesToCreate = {
            projectId,
            connectorId,
            freeproxies,
        };

        await lastValueFrom(this.proxy.emit(
            MESSAGE_FREEPROXIES_CREATE,
            create
        ));
    }

    async synchronizeFreeproxies(actions: ISynchronizeFreeproxies): Promise<void> {
        this.logger.debug(`synchronizeFreeproxies(): updated.length=${actions.updated.length} / removed.length=${actions.removed.length}`);

        await lastValueFrom(this.proxy.emit(
            MESSAGE_FREEPROXIES_SYNC,
            actions
        ));
    }

    async getNextFreeproxiesToRefresh(
        nextRefreshTs: number, count: number
    ): Promise<IFreeproxyToRefresh[]> {
        this.logger.debug(`getNextFreeproxiesToRefresh(): nextRefreshTs=${nextRefreshTs} / count=${count}`);

        const freeproxies = await this.database.getNextFreeproxiesToRefresh(
            nextRefreshTs,
            count
        );

        return freeproxies;
    }

    async updateFreeproxiesNextRefreshTs(
        freeproxiesIds: string[], nextRefreshTs: number
    ): Promise<void> {
        this.logger.debug(`updateFreeproxiesNextRefreshTs(): freeproxiesIds.length=${freeproxiesIds.length} / nextRefreshTs=${nextRefreshTs}`);

        const update: IFreeproxiesNextRefreshToUpdate = {
            freeproxiesIds,
            nextRefreshTs,
        };

        await lastValueFrom(this.proxy.emit(
            MESSAGE_FREEPROXIES_UPDATE_NEXT_REFRESH,
            update
        ));
    }

    async getAllProjectSourcesById(
        projectId: string, connectorId: string
    ): Promise<ISource[]> {
        this.logger.debug(`getAllProjectSourcesById(): projectId=${projectId} / connectorId=${connectorId}`);

        const sources = await this.database.getAllProjectSourcesById(
            projectId,
            connectorId
        );

        return sources;
    }

    async getSourceById(
        projectId: string, connectorId: string, sourceId: string
    ): Promise<ISource> {
        this.logger.debug(`getSourceById(): projectId=${projectId} / connectorId=${connectorId} / sourceId=${sourceId}`);

        const source = await this.database.getSourceById(
            projectId,
            connectorId,
            sourceId
        );

        return source;
    }

    async createSources(sources: ISource[]): Promise<void> {
        this.logger.debug(`createSources(): sources.length=${sources.length}`);

        await lastValueFrom(this.proxy.emit(
            MESSAGE_SOURCES_CREATE,
            sources
        ));
    }

    async updateSources(sources: ISource[]): Promise<void> {
        this.logger.debug(`updateSources(): sources.length=${sources.length}`);

        await lastValueFrom(this.proxy.emit(
            MESSAGE_SOURCES_UPDATE,
            sources
        ));
    }

    async removeSources(sources: ISource[]): Promise<void> {
        this.logger.debug(`removeSources(): sources.length=${sources.length}`);

        await lastValueFrom(this.proxy.emit(
            MESSAGE_SOURCES_REMOVE,
            sources
        ));
    }

    async getNextSourceToRefresh(nextRefreshTs: number): Promise<ISource> {
        this.logger.debug(`getNextSourceToRefresh(): nextRetryTs=${nextRefreshTs}`);

        const source = await this.database.getNextSourceToRefresh(nextRefreshTs);

        return source;
    }

    async updateSourceNextRefreshTs(
        projectId: string,
        connectorId: string,
        sourceId: string,
        nextRefreshTs: number
    ): Promise<void> {
        this.logger.debug(`updateSourceNextRefreshTs(): projectId=${projectId} / connectorId=${connectorId} / sourceId=${sourceId} / nextRefreshTs=${nextRefreshTs}`);

        const update: ISourceNextRefreshToUpdate = {
            projectId,
            connectorId,
            sourceId,
            nextRefreshTs,
        };

        await lastValueFrom(this.proxy.emit(
            MESSAGE_SOURCE_UPDATE_NEXT_REFRESH,
            update
        ));
    }

    //////////// TASKS ////////////
    async getAllProjectTasksById(projectId: string): Promise<ITaskView[]> {
        this.logger.debug(`getAllProjectTasksById(): projectId=${projectId}`);

        const tasks = await this.database.getAllProjectTasksById(projectId);

        return tasks;
    }

    async getTaskById(
        projectId: string, taskId: string
    ): Promise<ITaskData> {
        this.logger.debug(`getTaskById(): projectId=${projectId} / taskId=${taskId}`);

        const task = await this.database.getTaskById(
            projectId,
            taskId
        );

        return task;
    }

    async createTask(task: ITaskData): Promise<void> {
        this.logger.debug(`createTask(): task.id=${task.id}`);

        await lastValueFrom(this.proxy.emit(
            MESSAGE_TASKS_CREATE,
            task
        ));
    }

    async updateTask(task: ITaskData): Promise<void> {
        this.logger.debug(`updateTask(): task.id=${task.id}`);

        await lastValueFrom(this.proxy.emit(
            MESSAGE_TASKS_UPDATE,
            task
        ));
    }

    async lockTask(
        projectId: string, taskId: string
    ): Promise<void> {
        this.logger.debug(`lockTask(): projectId=${projectId} / taskId=${taskId}`);

        const update: ITaskToLock = {
            projectId,
            taskId,
        };

        await lastValueFrom(this.proxy.emit(
            MESSAGE_TASKS_LOCK,
            update
        ));
    }

    async removeTask(task: ITaskData): Promise<void> {
        this.logger.debug(`removeTask(): task.id=${task.id}`);

        await lastValueFrom(this.proxy.emit(
            MESSAGE_TASKS_REMOVE,
            task
        ));
    }

    async getProjectRunningTaskCount(
        projectId: string, connectorId: string
    ): Promise<number> {
        this.logger.debug(`getProjectRunningTaskCount(): projectId=${projectId} / connectorId=${connectorId}`);

        const count = await this.database.getProjectRunningTaskCount(
            projectId,
            connectorId
        );

        return count;
    }

    async getNextTaskToRefresh(nextRetryTs: number): Promise<ITaskData> {
        this.logger.debug(`getNextTaskToRefresh(): nextRetryTs=${nextRetryTs}`);

        const task = await this.database.getNextTaskToRefresh(nextRetryTs);

        return task;
    }

    //////////// PARAMS ////////////
    async getParam(key: string): Promise<string> {
        this.logger.debug(`getParams(): key=${key}`);

        const value = await this.database.getParam(key);

        return value;
    }

    //////////// CERTIFICATES ////////////
    async getCertificateForHostname(hostname: string): Promise<ICertificate> {
        this.logger.debug(`getCertificateForHostname(): hostname=${hostname}`);

        const certificate = await this.database.getCertificateForHostname(hostname);

        return certificate;
    }

    async createCertificateForHostname(
        hostname: string, certificate: ICertificate
    ): Promise<void> {
        this.logger.debug(`createCertificateForHostname(): hostname=${hostname}}`);

        const update: ICertificateToCreate = {
            hostname,
            certificate,
        };

        await lastValueFrom(this.proxy.emit(
            MESSAGE_CERTIFICATE_CREATE,
            update
        ));
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
