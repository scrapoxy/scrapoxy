import { createHash } from 'crypto';
import {
    Inject,
    Injectable,
    Logger,
} from '@nestjs/common';
import {
    CONNECTOR_FREEPROXIES_TYPE,
    EProjectStatus,
    formatFreeproxyId,
    toConnectorView,
    toCredentialView,
    toOptionalValue,
    toTaskView,
    toUserProject,
} from '@scrapoxy/common';
import { v4 as uuid } from 'uuid';
import { COMMANDER_FRONTEND_MODULE_CONFIG } from './frontend.constants';
import { filterDuplicateOutboundIpFreeproxies } from './frontend.helpers';
import {
    schemaConnectorToActivate,
    schemaConnectorToCreate,
    schemaConnectorToScale,
    schemaConnectorToUpdate,
    schemaCredentialToCreate,
    schemaCredentialToUpdate,
    schemaFreeproxiesToRemove,
    schemaProjectToCreate,
    schemaProjectToUpdate,
    schemaProjectUserEmailToAdd,
    schemaSourcesToRemove,
    schemaTaskToCreate,
} from './frontend.validation';
import { ConnectorprovidersService } from '../../connectors';
import {
    ConnectorCertificateNotUsedError,
    ConnectorRemoveError,
    ConnectorUpdateError,
    ConnectorWrongTypeError,
    CredentialRemoveError,
    CredentialUpdateError,
    ProjectRemoveError,
    ProjectUserAccessError,
    ProxiesNotFoundError,
    TaskCancelError,
    TaskCreateError,
    TaskRemoveError,
    UserNotFoundByEmailError,
    UserNotFoundError,
} from '../../errors';
import {
    generateBasicAuthToken,
    generateCertificateSelfSigned,
    validate,
} from '../../helpers';
import { StorageprovidersService } from '../../storages';
import { TasksService } from '../../tasks';
import {
    schemaProjectStatusToSet,
    schemaProxiesToRemove,
} from '../commander.validation';
import type { ICommanderFrontendModuleConfig } from './frontend.module';
import type {
    ICertificate,
    IConnectorData,
    IConnectorDataToCreate,
    IConnectorFreeproxyConfig,
    IConnectorProxiesSync,
    IConnectorProxiesView,
    IConnectorToCreate,
    IConnectorToInstall,
    IConnectorToUpdate,
    IConnectorView,
    ICredentialData,
    ICredentialQuery,
    ICredentialToCreate,
    ICredentialToCreateCallback,
    ICredentialToUpdate,
    ICredentialView,
    IFreeproxiesToCreate,
    IFreeproxiesToRemoveOptions,
    IFreeproxyBase,
    IProjectData,
    IProjectDataCreate,
    IProjectMetricsView,
    IProjectToCreate,
    IProjectToUpdate,
    IProjectUserLink,
    IProjectView,
    IProxyIdToRemove,
    ISourceBase,
    ISourcesAndFreeproxies,
    ITaskData,
    ITaskToCreate,
    ITaskView,
    IUserProject,
} from '@scrapoxy/common';


@Injectable()
export class CommanderFrontendService {
    protected readonly logger = new Logger(CommanderFrontendService.name);

    constructor(
        @Inject(COMMANDER_FRONTEND_MODULE_CONFIG)
        private readonly config: ICommanderFrontendModuleConfig,
        private readonly connectorproviders: ConnectorprovidersService,
        private readonly storageproviders: StorageprovidersService,
        private readonly tasks: TasksService
    ) {
    }

    //////////// PROJECTS ////////////
    async getAllProjectsForUserId(userId: string): Promise<IProjectView[]> {
        this.logger.debug(`getAllProjectsForUserId(): userId=${userId}`);

        const projects = await this.storageproviders.storage.getAllProjectsForUserId(userId);

        return projects;
    }

    async getProjectById(projectId: string): Promise<IProjectData> {
        this.logger.debug(`getProjectById(): projectId=${projectId}`);

        const project = await this.storageproviders.storage.getProjectById(projectId);

        return project;
    }

    async getProjectMetricsById(projectId: string): Promise<IProjectMetricsView> {
        this.logger.debug(`getProjectMetricsById(): projectId=${projectId}`);

        const view = await this.storageproviders.storage.getProjectMetricsById(projectId);

        return view;
    }

    async getProjectTokenById(projectId: string): Promise<string> {
        this.logger.debug(`getProjectTokenById(): projectId=${projectId}`);

        const token = await this.storageproviders.storage.getProjectTokenById(projectId);

        return token;
    }

    async createProject(
        userId: string, projectToCreate: IProjectToCreate
    ): Promise<IProjectData> {
        this.logger.debug(`createProject(): userId=${userId} / projectToCreate.name=${projectToCreate.name}`);

        await validate(
            schemaProjectToCreate,
            projectToCreate
        );

        await this.storageproviders.storage.checkIfProjectNameExists(projectToCreate.name);

        const project: IProjectData = {
            ...projectToCreate,
            id: uuid(),
            status: EProjectStatus.HOT,
            connectorDefaultId: null,
        };
        const token = generateBasicAuthToken();
        const create: IProjectDataCreate = {
            userId,
            token,
            project,
        };

        await this.storageproviders.storage.createProject(create);

        return project;
    }

    async updateProject(
        projectId: string, projectToUpdate: IProjectToUpdate
    ): Promise<IProjectData> {
        this.logger.debug(`updateProject(): projectId=${projectId}`);

        await validate(
            schemaProjectToUpdate,
            projectToUpdate
        );

        await this.storageproviders.storage.checkIfProjectNameExists(
            projectToUpdate.name,
            projectId
        );

        const project = await this.storageproviders.storage.getProjectById(projectId);

        Object.assign(
            project,
            projectToUpdate
        );

        await this.storageproviders.storage.updateProject(project);

        return project;
    }

    async removeProject(projectId: string): Promise<void> {
        this.logger.debug(`removeProject(): projectId=${projectId}`);

        const count = await this.storageproviders.storage.getProjectConnectorsCountById(projectId);

        if (count > 0) {
            throw new ProjectRemoveError(
                projectId,
                'Project has connectors attached'
            );
        }

        const project = await this.storageproviders.storage.getProjectById(projectId);

        await this.storageproviders.storage.removeProject(project);
    }

    async getAllProjectUsersById(projectId: string): Promise<IUserProject[]> {
        this.logger.debug(`getAllProjectUsersById():projectId=${projectId}`);

        const users = await this.storageproviders.storage.getAllProjectUsersById(projectId);

        return users;
    }

    async canUserAccessToProject(
        projectId: string, userId: string
    ): Promise<boolean> {
        this.logger.debug(`canUserAccessToProject(): projectId=${projectId} / userId=${userId}`);

        const canAccess = await this.storageproviders.storage.canUserAccessToProject(
            projectId,
            userId
        );

        return canAccess;
    }

    async addUserToProjectByEmail(
        userId: string, projectId: string, addUserEmail: string
    ): Promise<IUserProject> {
        this.logger.debug(`addUserToProjectByEmail(): userId=${userId} / projectId=${projectId} / addUserEmail=${addUserEmail}`);

        await validate(
            schemaProjectUserEmailToAdd,
            addUserEmail
        );

        const addUser = await this.storageproviders.storage.getUserByEmail(addUserEmail);

        if (!addUser) {
            throw new UserNotFoundByEmailError(addUserEmail);
        }

        if (userId === addUser.id) {
            throw new ProjectUserAccessError(
                projectId,
                'Cannot add yourself to a project'
            );
        }

        const canAccess = await this.storageproviders.storage.canUserAccessToProject(
            projectId,
            addUser.id
        );

        if (canAccess) {
            throw new ProjectUserAccessError(
                projectId,
                `User ${addUser.id} already has access to project ${projectId}`
            );
        }

        const link: IProjectUserLink = {
            userId: addUser.id,
            projectId,
        };

        await this.storageproviders.storage.addUserToProject(link);

        return toUserProject(addUser);
    }

    async removeUserFromProject(
        userId: string, projectId: string, removeUserId: string
    ): Promise<void> {
        this.logger.debug(`removeUserFromProject(): userId=${userId} / projectId=${projectId} / removeUserId=${removeUserId}`);

        if (userId === removeUserId) {
            throw new ProjectUserAccessError(
                projectId,
                'Cannot remove yourself from a project'
            );
        }

        const user = await this.storageproviders.storage.getUserById(removeUserId);

        if (!user) {
            throw new UserNotFoundError(userId);
        }

        const canAccess = await this.storageproviders.storage.canUserAccessToProject(
            projectId,
            user.id
        );

        if (!canAccess) {
            throw new ProjectUserAccessError(
                projectId,
                `User ${user.id} has no access to project ${projectId}`
            );
        }

        const link: IProjectUserLink = {
            userId: user.id,
            projectId,
        };

        await this.storageproviders.storage.removeUserFromProject(link);
    }

    async setProjectStatus(
        projectId: string, status: EProjectStatus
    ): Promise<void> {
        this.logger.debug(`setProjectStatus(): projectId=${projectId} / status=${status}`);

        await validate(
            schemaProjectStatusToSet,
            status
        );

        const project = await this.storageproviders.storage.getProjectById(projectId);

        if (project.status === status) {
            return;
        }

        project.status = status;

        const promises: Promise<void>[] = [
            this.storageproviders.storage.updateProject(project),
        ];

        if (status === EProjectStatus.HOT) {
            promises.push(this.storageproviders.storage.updateProjectLastDataTs(
                projectId,
                Date.now()
            ));
        }

        await Promise.all(promises);
    }

    async setProjectConnectorDefault(
        projectId: string, connectorDefaultId: string | null
    ): Promise<void> {
        this.logger.debug(`setProjectConnectorDefault(): projectId=${projectId} / connectorDefaultId=${connectorDefaultId}`);

        const project = await this.storageproviders.storage.getProjectById(projectId);

        if (connectorDefaultId) {
            const connector = await this.storageproviders.storage.getConnectorById(
                projectId,
                connectorDefaultId
            );

            project.connectorDefaultId = connector.id;
        } else {
            project.connectorDefaultId = null;
        }

        await this.storageproviders.storage.updateProject(project);
    }

    async renewProjectToken(projectId: string): Promise<string> {
        this.logger.debug(`renewProjectToken(): projectId=${projectId}`);

        const token = generateBasicAuthToken();

        await this.storageproviders.storage.updateProjectToken(
            projectId,
            token
        );

        return token;
    }

    //////////// CREDENTIALS ////////////
    async getAllProjectCredentials(
        projectId: string, type: string | null
    ): Promise<ICredentialView[]> {
        this.logger.debug(`getAllProjectCredentials(): projectId=${projectId} / type=${type}`);

        const credentials = await this.storageproviders.storage.getAllProjectCredentials(
            projectId,
            type
        );

        return credentials;
    }

    async getCredentialById(
        projectId: string, credentialId: string
    ): Promise<ICredentialData> {
        this.logger.debug(`getCredentialById(): projectId=${projectId} / credentialId=${credentialId}`);

        const credential = await this.storageproviders.storage.getCredentialById(
            projectId,
            credentialId
        );

        return credential;
    }

    async createCredential(
        projectId: string, credentialToCreate: ICredentialToCreate
    ): Promise<ICredentialView> {
        this.logger.debug(`createCredential(): projectId=${projectId} / credentialToCreate.name=${credentialToCreate.name}`);

        await validate(
            schemaCredentialToCreate,
            credentialToCreate
        );

        await this.storageproviders.storage.checkIfCredentialNameExists(
            projectId,
            credentialToCreate.name
        );

        const factory = this.connectorproviders.getFactory(credentialToCreate.type);
        await factory.validateCredentialConfig(credentialToCreate.config);

        // Project exists because of control in the guard
        const credential: ICredentialData = {
            ...credentialToCreate,
            id: uuid(),
            projectId: projectId,
        };

        await this.storageproviders.storage.createCredential(credential);

        return toCredentialView(credential);
    }

    async createCredentialCallback(callback: ICredentialToCreateCallback): Promise<ICredentialView> {
        this.logger.debug(`createCredentialCallback(): callback.projectId=${callback.projectId} / callback.name=${callback.name}`);

        const factory = this.connectorproviders.getFactory(callback.type);
        const config = await factory.validateCredentialCallback(callback);
        const credentialToCreate: ICredentialToCreate = {
            name: callback.name,
            type: callback.type,
            config,
        };
        const credential = await this.createCredential(
            callback.projectId,
            credentialToCreate
        );

        return toCredentialView(credential);
    }

    async updateCredential(
        projectId: string, credentialId: string, credentialToUpdate: ICredentialToUpdate
    ): Promise<ICredentialView> {
        this.logger.debug(`updateCredential(): projectId=${projectId} / credentialId=${credentialId}`);

        await validate(
            schemaCredentialToUpdate,
            credentialToUpdate
        );

        await this.storageproviders.storage.checkIfCredentialNameExists(
            projectId,
            credentialToUpdate.name,
            credentialId
        );

        const credential = await this.storageproviders.storage.getCredentialById(
            projectId,
            credentialId
        );
        const count = await this.storageproviders.storage.getCredentialConnectorsCountById(
            projectId,
            credential.id,
            true
        );

        if (count > 0) {
            throw new CredentialUpdateError(
                credential.projectId,
                credential.id,
                'Credential used in connectors configuration'
            );
        }

        const factory = this.connectorproviders.getFactory(credential.type);
        await factory.validateCredentialConfig(credentialToUpdate.config);

        Object.assign(
            credential,
            credentialToUpdate
        );

        await this.storageproviders.storage.updateCredential(credential);

        return toCredentialView(credential);
    }

    async removeCredential(
        projectId: string, credentialId: string
    ): Promise<void> {
        this.logger.debug(`removeCredential(): projectId=${projectId} / credentialId=${credentialId}`);

        const credential = await this.storageproviders.storage.getCredentialById(
            projectId,
            credentialId
        );
        const count = await this.storageproviders.storage.getCredentialConnectorsCountById(
            projectId,
            credential.id,
            false
        );

        if (count > 0) {
            throw new CredentialRemoveError(
                credential.projectId,
                credential.id,
                'Credential used in connectors configuration'
            );
        }

        await this.storageproviders.storage.removeCredential(credential);
    }

    async queryCredential(
        projectId: string, credentialId: string, query: ICredentialQuery
    ): Promise<any> {
        this.logger.debug(`queryCredential(): projectId=${projectId} / credentialId=${credentialId} / query.type=${query.type}`);

        const credential = await this.storageproviders.storage.getCredentialById(
            projectId,
            credentialId
        );
        const factory = this.connectorproviders.getFactory(credential.type);
        const res = await factory.queryCredential(
            credential,
            query
        );

        return res;
    }

    //////////// CONNECTORS ////////////
    async getAllProjectConnectorsAndProxiesById(projectId: string): Promise<IConnectorProxiesView[]> {
        this.logger.debug(`getAllProjectConnectorsAndProxiesById(): projectId=${projectId}`);

        const connectors = await this.storageproviders.storage.getAllProjectConnectorsAndProxiesById(projectId);

        return connectors;
    }

    async getAllConnectorProxiesById(
        projectId: string, connectorId: string
    ): Promise<IConnectorProxiesView> {
        this.logger.debug(`getAllConnectorProxiesById(): projectId=${projectId} / connectorId=${connectorId}`);

        const cp = await this.storageproviders.storage.getAllConnectorProxiesById(
            projectId,
            connectorId
        );

        return cp;
    }

    async getAllConnectorProxiesSyncById(
        projectId: string, connectorId: string
    ): Promise<IConnectorProxiesSync> {
        this.logger.debug(`getAllConnectorProxiesSyncById(): projectId=${projectId} / connectorId=${connectorId}`);

        const cp = await this.storageproviders.storage.getAllConnectorProxiesSyncById(
            projectId,
            connectorId
        );

        return cp;
    }

    async getConnectorById(
        projectId: string, connectorId: string
    ): Promise<IConnectorData> {
        this.logger.debug(`getConnectorById(): projectId=${projectId} / connectorId=${connectorId}`);

        const connector = await this.storageproviders.storage.getConnectorById(
            projectId,
            connectorId
        );

        return connector;
    }

    async createConnector(
        projectId: string, connectorToCreate: IConnectorToCreate
    ): Promise<IConnectorView> {
        this.logger.debug(`createConnector(): projectId=${projectId} / connectorToCreate.name=${connectorToCreate.name}`);

        await validate(
            schemaConnectorToCreate,
            connectorToCreate
        );

        await this.storageproviders.storage.checkIfConnectorNameExists(
            projectId,
            connectorToCreate.name
        );

        const credential = await this.storageproviders.storage.getCredentialById(
            projectId,
            connectorToCreate.credentialId
        );
        const factory = this.connectorproviders.getFactory(credential.type);
        await factory.validateConnectorConfig(
            credential.config,
            connectorToCreate.config
        );

        const project = await this.storageproviders.storage.getProjectById(projectId);
        let certificate: ICertificate | null,
            certificateEndAt: number | null;

        if (factory.config.useCertificate) {
            const certificateInfo = generateCertificateSelfSigned(connectorToCreate.certificateDurationInMs);
            certificate = certificateInfo.certificate;
            certificateEndAt = certificateInfo.endAt;
        } else {
            certificate = null;
            certificateEndAt = null;
        }

        const connector: IConnectorDataToCreate = {
            ...connectorToCreate,
            id: uuid(),
            projectId: project.id,
            type: credential.type,
            active: false,
            error: null,
            certificate,
            certificateEndAt,
        };

        await this.storageproviders.storage.createConnector(connector);

        if (!project.connectorDefaultId) {
            project.connectorDefaultId = connector.id;

            await this.storageproviders.storage.updateProject(project);
        }

        return toConnectorView(connector);
    }

    async updateConnector(
        projectId: string, connectorId: string, connectorToUpdate: IConnectorToUpdate
    ): Promise<IConnectorView> {
        this.logger.debug(`updateConnector(): projectId=${projectId} / connectorToUpdate=${connectorId}`);

        await validate(
            schemaConnectorToUpdate,
            connectorToUpdate
        );

        await this.storageproviders.storage.checkIfConnectorNameExists(
            projectId,
            connectorToUpdate.name,
            connectorId
        );

        const connector = await this.storageproviders.storage.getConnectorById(
            projectId,
            connectorId
        );

        if (connector.active) {
            throw new ConnectorUpdateError(
                connector.projectId,
                connector.id,
                'Cannot update an active connector'
            );
        }

        const credential = await this.storageproviders.storage.getCredentialById(
            projectId,
            connectorToUpdate.credentialId
        );

        if (connector.type !== credential.type) {
            throw new ConnectorUpdateError(
                connector.projectId,
                connector.id,
                'Cannot change type of connector credential'
            );
        }

        const factory = this.connectorproviders.getFactory(connector.type);
        await factory.validateConnectorConfig(
            credential.config,
            connectorToUpdate.config
        );

        Object.assign(
            connector,
            connectorToUpdate
        );

        await this.storageproviders.storage.updateConnector(connector);

        return toConnectorView(connector);
    }

    async removeConnector(
        projectId: string, connectorId: string
    ): Promise<void> {
        this.logger.debug(`removeConnector(): projectId=${projectId} / connectorId=${connectorId}`);

        const connector = await this.storageproviders.storage.getConnectorById(
            projectId,
            connectorId
        );

        if (connector.active) {
            throw new ConnectorRemoveError(
                connector.projectId,
                connector.id,
                'Cannot remove an active connector'
            );
        }

        const count = await this.storageproviders.storage.getConnectorProxiesCountById(
            projectId,
            connector.id
        );

        if (count > 0) {
            throw new ConnectorRemoveError(
                connector.projectId,
                connector.id,
                'Cannot remove a connector which has proxies'
            );
        }

        const project = await this.storageproviders.storage.getProjectById(projectId);

        if (project.connectorDefaultId === connector.id) {
            project.connectorDefaultId = await this.storageproviders.storage.getAnotherConnectorById(
                projectId,
                connector.id
            );

            await this.storageproviders.storage.updateProject(project);
        }

        await this.storageproviders.storage.removeConnector(connector);
    }

    async scaleConnector(
        projectId: string, connectorId: string, proxiesMax: number
    ): Promise<void> {
        this.logger.debug(`scaleConnector(): projectId=${projectId} / connectorId=${connectorId} / proxiesMax=${proxiesMax}`);

        await validate(
            schemaConnectorToScale,
            proxiesMax
        );

        const connector = await this.storageproviders.storage.getConnectorById(
            projectId,
            connectorId
        );

        connector.proxiesMax = proxiesMax;

        await this.storageproviders.storage.updateConnector(connector);
    }

    async activateConnector(
        projectId: string, connectorId: string, active: boolean
    ): Promise<void> {
        this.logger.debug(`activateConnector(): projectId=${projectId} / connectorId=${connectorId} / active=${active}`);

        await validate(
            schemaConnectorToActivate,
            active
        );

        const connector = await this.storageproviders.storage.getConnectorById(
            projectId,
            connectorId
        );

        if (active === connector.active) {
            throw new ConnectorUpdateError(
                connector.projectId,
                connector.id,
                'Connector is already active or inactive'
            );
        }

        if (active) {
            const credential = await this.storageproviders.storage.getCredentialById(
                connector.projectId,
                connector.credentialId
            );
            const factory = this.connectorproviders.getFactory(connector.type);

            await factory.validateConnectorConfig(
                credential.config,
                connector.config
            );

            await factory.validateInstallCommand(
                credential,
                connector
            );
        }

        connector.active = active;

        await this.storageproviders.storage.updateConnector(connector);
    }

    async installConnector(
        projectId: string,
        connectorId: string,
        jwt: string,
        connectorToInstall: IConnectorToInstall
    ): Promise<ITaskView> {
        this.logger.debug(`installConnector(): projectId=${projectId} / connectorId=${connectorId}`);

        const connector = await this.storageproviders.storage.getConnectorById(
            projectId,
            connectorId
        );

        if (connector.active) {
            throw new ConnectorUpdateError(
                connector.projectId,
                connector.id,
                'Cannot install an active connector'
            );
        }

        const count = await this.storageproviders.storage.getProjectRunningTaskCount(
            projectId,
            connectorId
        );

        if (count > 0) {
            throw new TaskCreateError(
                connector.projectId,
                connector.id,
                'Connector already runs a task'
            );
        }

        const [
            installId, certificate, credential,
        ] = await Promise.all([
            this.storageproviders.storage.getParam('installId'),
            this.storageproviders.storage.getConnectorCertificateById(
                projectId,
                connector.id
            ),
            this.storageproviders.storage.getCredentialById(
                projectId,
                connector.credentialId
            ),
        ]);
        const factory = this.connectorproviders.getFactory(credential.type);
        await factory.validateInstallConfig(connectorToInstall.config);

        const taskToCreate = await factory.buildInstallCommand(
            installId,
            credential,
            connector,
            certificate,
            this.config.fingerprint,
            connectorToInstall.config
        );
        const task = await this.createTask(
            connector.projectId,
            connector.id,
            jwt,
            taskToCreate
        );

        return task;
    }

    async uninstallConnector(
        projectId: string, connectorId: string, jwt: string
    ): Promise<ITaskView> {
        this.logger.debug(`uninstallConnector(): projectId=${projectId} / connectorId=${connectorId}`);

        const [
            connector, count,
        ] = await Promise.all([
            this.storageproviders.storage.getConnectorById(
                projectId,
                connectorId
            ),
            this.storageproviders.storage.getProjectRunningTaskCount(
                projectId,
                connectorId
            ),
        ]);

        if (count > 0) {
            throw new TaskCreateError(
                connector.projectId,
                connector.id,
                'Connector already runs a task'
            );
        }

        const credential = await this.storageproviders.storage.getCredentialById(
            projectId,
            connector.credentialId
        );
        const factory = this.connectorproviders.getFactory(credential.type);
        const taskToCreate = await factory.buildUninstallCommand(
            credential,
            connector
        );
        const task = await this.createTask(
            connector.projectId,
            connector.id,
            jwt,
            taskToCreate
        );

        return task;
    }

    async validateConnector(
        projectId: string, connectorId: string
    ): Promise<void> {
        this.logger.debug(`validateConnector(): projectId=${projectId} / connectorId=${connectorId}`);

        const connector = await this.storageproviders.storage.getConnectorById(
            projectId,
            connectorId
        );
        const credential = await this.storageproviders.storage.getCredentialById(
            connector.projectId,
            connector.credentialId
        );
        const factory = this.connectorproviders.getFactory(connector.type);

        await factory.validateInstallCommand(
            credential,
            connector
        );
    }

    async renewConnectorCertificate(
        projectId: string, connectorId: string, durationInMs: number
    ): Promise<void> {
        this.logger.debug(`renewConnectorCertificate(): projectId=${projectId} / connectorId=${connectorId} / durationInMs=${durationInMs}`);

        const connector = await this.storageproviders.storage.getConnectorById(
            projectId,
            connectorId
        );
        const factory = this.connectorproviders.getFactory(connector.type);

        if (!factory.config.useCertificate) {
            throw new ConnectorCertificateNotUsedError(
                projectId,
                connectorId,
                factory.type
            );
        }

        const certificateInfo = generateCertificateSelfSigned(durationInMs);

        await this.storageproviders.storage.updateConnectorCertificate(
            projectId,
            connectorId,
            certificateInfo
        );
    }

    //////////// PROXIES ////////////
    async askProxiesToRemove(
        projectId: string, proxiesIds: IProxyIdToRemove[]
    ): Promise<void> {
        this.logger.debug(`askProxiesToRemove(): projectId=${projectId} / proxiesIds.length=${proxiesIds.length}`);

        await validate(
            schemaProxiesToRemove,
            proxiesIds
        );

        if (proxiesIds.length <= 0) {
            return;
        }

        const forceMap = new Map<string, boolean>();
        for (const proxy of proxiesIds) {
            forceMap.set(
                proxy.id,
                proxy.force
            );
        }

        const ids = proxiesIds.map((p) => p.id);
        const proxiesFound = await this.storageproviders.storage.getProjectProxiesByIds(
            projectId,
            ids,
            false
        );

        if (proxiesFound.length <= 0) {
            throw new ProxiesNotFoundError(ids);
        }

        for (const proxyFound of proxiesFound) {
            proxyFound.removing = true;
            proxyFound.removingForce = forceMap.get(proxyFound.id) ?? false;
        }

        await this.storageproviders.storage.synchronizeProxies({
            created: [],
            updated: proxiesFound,
            removed: [],
        });

        await this.storageproviders.storage.addProjectsMetrics([
            {
                project: {
                    id: projectId,
                    snapshot: {
                        requests: 0,
                        stops: proxiesFound.length,
                        bytesReceived: 0,
                        bytesSent: 0,
                    },
                },
            },
        ]);
    }

    //////////// FREE PROXIES ////////////
    async getAllProjectSourcesAndFreeproxiesById(
        projectId: string, connectorId: string
    ): Promise<ISourcesAndFreeproxies> {
        this.logger.debug(`getAllProjectSourcesAndFreeproxiesById(): projectId=${projectId} / connectorId=${connectorId}`);

        const [
            sources, freeproxies,
        ] = await Promise.all([
            this.storageproviders.storage.getAllProjectSourcesById(
                projectId,
                connectorId
            ),
            this.storageproviders.storage.getAllProjectFreeproxiesById(
                projectId,
                connectorId
            ),
        ]);

        return {
            sources,
            freeproxies,
        };
    }

    async createFreeproxies(
        projectId: string,
        connectorId: string,
        freeproxies: IFreeproxyBase[]
    ): Promise<void> {
        this.logger.debug(`createFreeproxies(): projectId=${projectId} / connectorId=${connectorId} / freeproxies.length=${freeproxies.length}`);

        if (freeproxies.length <= 0) {
            return;
        }

        const nowTime = Date.now();
        const connector = await this.storageproviders.storage.getConnectorById(
            projectId,
            connectorId
        );

        if (connector.type !== CONNECTOR_FREEPROXIES_TYPE) {
            throw new ConnectorWrongTypeError(
                CONNECTOR_FREEPROXIES_TYPE,
                connector.type
            );
        }

        const freeproxiesExisting = await this.storageproviders.storage.getAllProjectFreeproxiesById(
            projectId,
            connectorId
        );
        const freeproxiesIds = new Set(freeproxiesExisting.map((fp) => fp.id));
        const config = connector.config as IConnectorFreeproxyConfig;
        const freeproxiesToCreate = freeproxies.map((fp) => ({
            id: formatFreeproxyId(
                connectorId,
                fp
            ),
            projectId,
            connectorId: connectorId,
            key: fp.key,
            type: fp.type,
            address: fp.address,
            auth: fp.auth,
            timeoutDisconnected: config.freeproxiesTimeoutDisconnected,
            timeoutUnreachable: toOptionalValue(config.freeproxiesTimeoutUnreachable),
            disconnectedTs: nowTime,
            fingerprint: null,
            fingerprintError: null,
        }))
            .filter((fp) => !freeproxiesIds.has(fp.id));

        if (freeproxiesToCreate.length <= 0) {
            return;
        }

        const create: IFreeproxiesToCreate = {
            projectId,
            connectorId,
            freeproxies: freeproxiesToCreate,
        };

        await this.storageproviders.storage.createFreeproxies(create);
    }

    async removeFreeproxies(
        projectId: string, connectorId: string, options: IFreeproxiesToRemoveOptions
    ): Promise<void> {
        this.logger.debug(`removeFreeproxies(): projectId=${projectId} / connectorId=${connectorId}`);

        await validate(
            schemaFreeproxiesToRemove,
            options
        );

        let freeproxies = await this.storageproviders.storage.getAllProjectFreeproxiesById(
            projectId,
            connectorId
        );

        if (options.ids && options.ids.length > 0) {
            freeproxies = freeproxies.filter((fp) => options.ids!.includes(fp.id));
        }


        if (options.duplicate) {
            freeproxies = filterDuplicateOutboundIpFreeproxies(freeproxies);
        }

        if (options.onlyOffline) {
            freeproxies = freeproxies.filter((fp) => !fp.fingerprint);
        }

        if (freeproxies.length <= 0) {
            return;
        }

        await this.storageproviders.storage.synchronizeFreeproxies({
            updated: [],
            removed: freeproxies,
        });
    }

    async createSources(
        projectId: string,
        connectorId: string,
        sources: ISourceBase[]
    ): Promise<void> {
        this.logger.debug(`createSources(): projectId=${projectId} / connectorId=${connectorId} / sources.length=${sources.length}`);

        const connector = await this.storageproviders.storage.getConnectorById(
            projectId,
            connectorId
        );

        if (connector.type !== CONNECTOR_FREEPROXIES_TYPE) {
            throw new ConnectorWrongTypeError(
                CONNECTOR_FREEPROXIES_TYPE,
                connector.type
            );
        }

        const sourcesExisting = await this.storageproviders.storage.getAllProjectSourcesById(
            projectId,
            connectorId
        );
        const sourcesUrls = new Set(sourcesExisting.map((s) => s.url));
        const create = sources
            .filter((source) => !sourcesUrls.has(source.url))
            .map((source) => {
                const hash = createHash('sha256')
                    .update(source.url)
                    .digest('hex');

                return {
                    ...source,
                    projectId,
                    connectorId,
                    id: `${connectorId}:${hash}`,
                };
            });

        if (create.length <= 0) {
            return;
        }

        await this.storageproviders.storage.createSources(create);
    }

    async removeSources(
        projectId: string, connectorId: string, ids: string[]
    ): Promise<void> {
        this.logger.debug(`removeSources(): projectId=${projectId} / connectorId=${connectorId} / ids.length=${ids.length}`);

        await validate(
            schemaSourcesToRemove,
            ids
        );

        let sources = await this.storageproviders.storage.getAllProjectSourcesById(
            projectId,
            connectorId
        );

        if (ids && ids.length > 0) {
            sources = sources.filter((s) => ids!.includes(s.id));
        }

        if (sources.length <= 0) {
            return;
        }

        await this.storageproviders.storage.removeSources(sources);
    }

    //////////// TASKS ////////////
    async getAllProjectTasksById(projectId: string): Promise<ITaskView[]> {
        this.logger.debug(`getAllProjectTasksById(): projectId=${projectId}`);

        const tasks = await this.storageproviders.storage.getAllProjectTasksById(projectId);

        return tasks;
    }

    async getTaskById(
        projectId: string, taskId: string
    ): Promise<ITaskView> {
        this.logger.debug(`getTaskById(): projectId=${projectId} / taskId=${taskId}`);

        const task = await this.storageproviders.storage.getTaskById(
            projectId,
            taskId
        );

        return toTaskView(task);
    }

    async removeTask(
        projectId: string, taskId: string
    ): Promise<void> {
        this.logger.debug(`removeTask(): projectId=${projectId} / taskId=${taskId}`);

        const task = await this.storageproviders.storage.getTaskById(
            projectId,
            taskId
        );

        if (task.running) {
            throw new TaskRemoveError(
                task.projectId,
                taskId,
                'Task is running'
            );
        }

        await this.storageproviders.storage.removeTask(task);
    }

    async cancelTask(
        projectId: string, taskId: string
    ): Promise<void> {
        this.logger.debug(`cancelTask(): projectId=${projectId} / taskId=${taskId}`);

        const task = await this.storageproviders.storage.getTaskById(
            projectId,
            taskId
        );

        if (!task.running) {
            throw new TaskCancelError(
                task.projectId,
                task.id,
                'Cannot cancel a stopped task'
            );
        }

        task.cancelled = true;

        await this.storageproviders.storage.updateTask(task);
    }

    //////////// MISC ////////////
    private async createTask(
        projectId: string, connectorId: string, jwt: string, taskToCreate: ITaskToCreate
    ): Promise<ITaskView> {
        this.logger.debug(`createTask(): projectId=${projectId} / connectorId=${connectorId} / taskToCreate.type=${taskToCreate.type}`);

        await validate(
            schemaTaskToCreate,
            taskToCreate
        );

        const factory = this.tasks.getFactory(taskToCreate.type);
        await factory.validate(taskToCreate.data);

        const connector = await this.storageproviders.storage.getConnectorById(
            projectId,
            connectorId
        );
        const nowTime = Date.now();
        const task: ITaskData = {
            ...taskToCreate,
            id: uuid(),
            projectId: connector.projectId,
            connectorId: connector.id,
            running: true,
            cancelled: false,
            stepCurrent: 0,
            startAtTs: nowTime,
            endAtTs: null,
            nextRetryTs: nowTime,
            jwt,
        };

        await this.storageproviders.storage.createTask(task);

        return toTaskView(task);
    }
}
