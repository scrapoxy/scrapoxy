import type {
    IConnectorData,
    IConnectorToCreate,
    IConnectorToInstall,
    IConnectorToUpdate,
    IConnectorView,
} from '../connectors';
import type {
    ICredentialData,
    ICredentialQuery,
    ICredentialToCreate,
    ICredentialToCreateCallback,
    ICredentialToUpdate,
    ICredentialView,
} from '../credentials';
import type {
    IFreeproxiesToRemoveOptions,
    IFreeproxyBase,
    ISourceBase,
    ISourcesAndFreeproxies,
} from '../freeproxies';
import type {
    EProjectStatus,
    IProjectData,
    IProjectMetricsView,
    IProjectToCreate,
    IProjectToUpdate,
    IProjectView,
} from '../projects';
import type {
    IConnectorProxiesSync,
    IConnectorProxiesView,
    IProxyIdToRemove,
} from '../proxies';
import type { ITaskView } from '../tasks';
import type { IUserProject } from '../users';


export interface ICommanderFrontendClient {
    //////////// PROJECTS ////////////
    getAllProjectsForUserId: () => Promise<IProjectView[]>;

    getProjectById: (projectId: string) => Promise<IProjectData>;

    getProjectMetricsById: (projectId: string) => Promise<IProjectMetricsView>;

    getProjectTokenById: (projectId: string) => Promise<string>;

    createProject: (projectToCreate: IProjectToCreate) => Promise<IProjectData>;

    updateProject: (projectId: string, projectToUpdate: IProjectToUpdate) => Promise<IProjectData>;

    removeProject: (projectId: string) => Promise<void>;

    getAllProjectUsersById: (projectId: string) => Promise<IUserProject[]>;

    addUserToProjectByEmail: (projectId: string, addUserEmail: string) => Promise<IUserProject>;

    removeUserFromProject: (projectId: string, userId: string) => Promise<void>;

    setProjectStatus: (projectId: string, status: EProjectStatus) => Promise<void>;

    setProjectConnectorDefault: (projectId: string, connectorDefaultId: string | null) => Promise<void>;

    renewProjectToken: (projectId: string) => Promise<string>;

    //////////// CREDENTIALS ////////////
    getAllProjectCredentials: (projectId: string, type: string | null) => Promise<ICredentialView[]>;

    getCredentialById: (projectId: string, credentialId: string) => Promise<ICredentialData>;

    createCredential: (projectId: string, credentialToCreate: ICredentialToCreate) => Promise<ICredentialView>;

    createCredentialCallback: (credentialToCreate: ICredentialToCreateCallback) => Promise<ICredentialView>;

    updateCredential: (projectId: string, credentialId: string, credentialToUpdate: ICredentialToUpdate) => Promise<ICredentialView>;

    removeCredential: (projectId: string, credentialId: string) => Promise<void>;

    queryCredential: (projectId: string, credentialId: string, query: ICredentialQuery) => Promise<any>;

    //////////// CONNECTORS ////////////
    getAllConnectorsTypes: () => Promise<string[]>;

    getAllProjectConnectorsAndProxiesById: (projectId: string) => Promise<IConnectorProxiesView[]>;

    getAllConnectorProxiesById: (projectId: string, connectorId: string) => Promise<IConnectorProxiesView>;

    getAllConnectorProxiesSyncById: (projectId: string, connectorId: string) => Promise<IConnectorProxiesSync>;

    getConnectorById: (projectId: string, connectorId: string) => Promise<IConnectorData>;

    createConnector: (projectId: string, connectorToCreate: IConnectorToCreate) => Promise<IConnectorView>;

    updateConnector: (projectId: string, connectorId: string, connectorToUpdate: IConnectorToUpdate) => Promise<IConnectorView>;

    removeConnector: (projectId: string, connectorId: string) => Promise<void>;

    scaleConnector: (projectId: string, connectorId: string, proxiesMax: number) => Promise<void>;

    activateConnector: (projectId: string, connectorId: string, active: boolean) => Promise<void>;

    installConnector: (projectId: string, connectorId: string, connectorToInstall: IConnectorToInstall) => Promise<ITaskView>;

    uninstallConnector: (projectId: string, connectorId: string) => Promise<ITaskView>;

    validateConnector: (projectId: string, connectorId: string) => Promise<void>;

    renewConnectorCertificate: (projectId: string, connectorId: string, durationInMs: number) => Promise<void>;

    //////////// PROXIES ////////////
    askProxiesToRemove: (projectId: string, proxiesIds: IProxyIdToRemove[]) => Promise<void>;

    //////////// FREE PROXIES ////////////
    getAllProjectSourcesAndFreeproxiesById: (projectId: string, connectorId: string) => Promise<ISourcesAndFreeproxies>;

    createFreeproxies: (projectId: string, connectorId: string, freeproxies: IFreeproxyBase[]) => Promise<void>;

    removeFreeproxies: (projectId: string, connectorId: string, options: IFreeproxiesToRemoveOptions) => Promise<void>;

    createSources: (projectId: string, connectorId: string, sources: ISourceBase[]) => Promise<void>;

    removeSources: (projectId: string, connectorId: string, ids: string[]) => Promise<void>;

    //////////// TASKS ////////////
    getAllProjectTasksById: (projectId: string) => Promise<ITaskView[]>;

    getTaskById: (projectId: string, taskId: string) => Promise<ITaskView>;

    removeTask: (projectId: string, taskId: string) => Promise<void>;

    cancelTask: (projectId: string, taskId: string) => Promise<void>;
}
