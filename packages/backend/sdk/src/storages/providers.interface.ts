import type {
    INestApplication,
    INestApplicationContext,
} from '@nestjs/common';
import type {
    ICertificate,
    ICertificateInfo,
    IConnectorData,
    IConnectorDataToCreate,
    IConnectorProxiesSync,
    IConnectorProxiesView,
    IConnectorToRefresh,
    ICredentialData,
    ICredentialView,
    IFreeproxiesToCreate,
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
    ISynchronizeLocalProxiesData,
    ITaskData,
    ITaskView,
    IUserData,
    IUserProject,
} from '@scrapoxy/common';


export interface IStorageService {
    //////////// USERS ////////////
    getUserById: (userId: string) => Promise<IUserData>;

    getUserByEmail: (email: string) => Promise<IUserData>;

    checkIfUserEmailExists: (email: string, userId?: string) => Promise<void>;

    createUser: (user: IUserData) => Promise<void>;

    updateUser: (user: IUserData) => Promise<void>;

    //////////// PROJECTS ////////////
    getAllProjectsForUserId: (userId: string) => Promise<IProjectView[]>;

    getAllProjectsMetrics: () => Promise<IProjectMetricsView[]>;

    getProjectById: (projectId: string) => Promise<IProjectData>;

    getProjectSyncById: (projectId: string) => Promise<IProjectSync>;

    getProjectByToken: (token: string) => Promise<IProjectData>;

    getProjectMetricsById: (projectId: string) => Promise<IProjectMetricsView>;

    getProjectTokenById: (projectId: string) => Promise<string>;

    getProjectIdByToken: (token: string) => Promise<string>;

    getProjectConnectorsCountById: (projectId: string) => Promise<number>;

    checkIfProjectNameExists: (name: string, projectId?: string) => Promise<void>;

    createProject: (create: IProjectDataCreate) => Promise<void>;

    updateProject: (project: IProjectData) => Promise<void>;

    updateProjectLastDataTs: (projectId: string, lastDataTs: number) => Promise<void>;

    removeProject: (project: IProjectData) => Promise<void>;

    getAllProjectUsersById: (projectId: string) => Promise<IUserProject[]>;

    canUserAccessToProject: (projectId: string, userId: string) => Promise<boolean>;

    addUserToProject: (link: IProjectUserLink) => Promise<void>;

    removeUserFromProject: (link: IProjectUserLink) => Promise<void>;

    addProjectsMetrics: (views: IProjectMetricsAddView[]) => Promise<void>;

    updateProjectToken: (projectId: string, token: string) => Promise<void>;

    //////////// CREDENTIALS ////////////
    getAllProjectCredentials: (projectId: string, type: string | null) => Promise<ICredentialView[]>;

    getCredentialById: (projectId: string, credentialId: string) => Promise<ICredentialData>;

    getCredentialConnectorsCountById: (projectId: string, credentialId: string, active: boolean) => Promise<number>;

    checkIfCredentialNameExists: (projectId: string, name: string, credentialId?: string) => Promise<void>;

    createCredential: (credential: ICredentialData) => Promise<void>;

    updateCredential: (credential: ICredentialData) => Promise<void>;

    removeCredential: (credential: ICredentialData) => Promise<void>;

    //////////// CONNECTORS ////////////
    getAllProjectConnectorsAndProxiesById: (projectId: string) => Promise<IConnectorProxiesView[]>;

    getAllConnectorProxiesById: (projectId: string, connectorId: string) => Promise<IConnectorProxiesView>;

    getAllConnectorProxiesSyncById: (projectId: string, connectorId: string) => Promise<IConnectorProxiesSync>;

    getConnectorById: (projectId: string, connectorId: string) => Promise<IConnectorData>;

    getAnotherConnectorById: (projectId: string, excludeConnectorId: string) => Promise<string | null>;

    getConnectorCertificateById: (projectId: string, connectorId: string) => Promise<ICertificate | null>;

    checkIfConnectorNameExists: (projectId: string, name: string, connectorId?: string) => Promise<void>;

    createConnector: (connector: IConnectorDataToCreate) => Promise<void>;

    updateConnector: (connector: IConnectorData) => Promise<void>;

    updateConnectorCertificate: (projectId: string, connectorId: string, certificateInfo: ICertificateInfo) => Promise<void>;

    removeConnector: (connector: IConnectorData) => Promise<void>;

    getNextConnectorToRefresh: (nextRefreshTs: number) => Promise<IConnectorToRefresh>;

    updateConnectorNextRefreshTs: (projectId: string, connectorId: string, nextRefreshTs: number) => Promise<void>;

    //////////// PROXIES ////////////
    getProxiesByIds: (proxiesIds: string[]) => Promise<IProxyData[]>;

    getProjectProxiesByIds: (projectId: string, proxiesIds: string[], removing?: boolean) => Promise<IProxyData[]>;

    getConnectorProxiesCountById: (projectId: string, connectorId: string) => Promise<number>;

    getProxiesCount: () => Promise<number>;

    synchronizeProxies: (actions: ISynchronizeLocalProxiesData) => Promise<void>;

    addProxiesMetrics: (proxies: IProxyMetricsAdd[]) => Promise<void>;

    getNextProxyToConnect: (projectId: string, proxyname: string | null) => Promise<IProxyToConnect>;

    updateProxyLastConnectionTs: (projectId: string, connectorId: string, proxyId: string, lastConnectionTs: number) => Promise<void>;

    getNextProxiesToRefresh: (nextRefreshTs: number, count: number) => Promise<IProxyToRefresh[]>;

    updateProxiesNextRefreshTs: (proxiesIds: string[], nextRefreshTs: number) => Promise<void>;

    //////////// FREE PROXIES ////////////
    getFreeproxiesByIds: (proxiesIds: string[]) => Promise<IFreeproxy[]>;

    getAllProjectFreeproxiesById: (projectId: string, connectorId: string) => Promise<IFreeproxy[]>;

    getSelectedProjectFreeproxies: (projectId: string, connectorId: string, keys: string[]) => Promise<IFreeproxy[]>;

    getNewProjectFreeproxies: (projectId: string, connectorId: string, count: number, excludeKeys: string[]) => Promise<IFreeproxy[]>;

    createFreeproxies: (create: IFreeproxiesToCreate) => Promise<void>;

    updateFreeproxies: (freeproxies: IFreeproxy[]) => Promise<void>;

    removeFreeproxies: (projectId: string, connectorId: string, freeproxiesIds: string[]) => Promise<void>;

    getNextFreeproxiesToRefresh: (nextRefreshTs: number, count: number) => Promise<IFreeproxyToRefresh[]>;

    updateFreeproxiesNextRefreshTs: (proxiesIds: string[], nextRefreshTs: number) => Promise<void>;

    //////////// TASKS ////////////
    getAllProjectTasksById: (projectId: string) => Promise<ITaskView[]>;

    getTaskById: (projectId: string, taskId: string) => Promise<ITaskData>;

    createTask: (task: ITaskData) => Promise<void>;

    updateTask: (task: ITaskData) => Promise<void>;

    lockTask: (projectId: string, taskId: string) => Promise<void>;

    removeTask: (task: ITaskData) => Promise<void>;

    getProjectRunningTaskCount: (projectId: string, connectorId: string) => Promise<number>;

    getNextTaskToRefresh: (nextRetryTs: number) => Promise<ITaskData>;

    //////////// PARAMS ////////////
    getParam: (key: string) => Promise<string>;

    //////////// CERTIFICATES ////////////
    getCertificateForHostname: (hostname: string) => Promise<ICertificate>;

    createCertificateForHostname: (hostname: string, certificate: ICertificate) => Promise<void>;
}


export interface IStorageModulesConfig {
    modules: any[];

    reset: (moduleRef: INestApplicationContext) => Promise<void>;

    connect: (app: INestApplication) => Promise<void>;
}
