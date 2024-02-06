import { EProjectStatus } from '@scrapoxy/common';
import axios from 'axios';
import { Agents } from '../../helpers';
import { catchError } from '../client.helpers';
import type {
    ICertificateToRenew,
    ICommanderFrontendClient,
    IConnectorActive,
    IConnectorData,
    IConnectorProxiesSync,
    IConnectorProxiesView,
    IConnectorScale,
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
    IFreeproxiesToRemoveOptions,
    IFreeproxyBase,
    IProjectConnectorDefaultId,
    IProjectData,
    IProjectMetricsView,
    IProjectStatus,
    IProjectToCreate,
    IProjectToken,
    IProjectToUpdate,
    IProjectView,
    IProxyIdToRemove,
    ISourceBase,
    ISourcesAndFreeproxies,
    ITaskView,
    IUserProject,
    IUserProjectEmail,
} from '@scrapoxy/common';
import type { AxiosInstance } from 'axios';


export class CommanderFrontendClient implements ICommanderFrontendClient {
    private readonly instance: AxiosInstance;

    constructor(
        url: string,
        useragent: string,
        token: string,
        agents: Agents
    ) {
        this.instance = axios.create({
            ...agents.axiosDefaults,
            baseURL: `${url}/frontend`,
            headers: {
                'User-Agent': useragent,
                Authorization: `Bearer ${token}`,
            },
        });

        this.instance.interceptors.response.use(
            void 0,
            (err: any) => {
                if (err.response) {
                    catchError(err.response.data);
                }

                throw err;
            }
        );
    }

    //////////// PROJECTS ////////////
    async getAllProjectsForUserId(): Promise<IProjectView[]> {
        const res = await this.instance.get<IProjectView[]>('projects');

        return res.data;
    }

    async getProjectById(projectId: string): Promise<IProjectData> {
        const res = await this.instance
            .get<IProjectData>(`projects/${projectId}`);

        return res.data;
    }

    async getProjectMetricsById(projectId: string): Promise<IProjectMetricsView> {
        const res = await this.instance
            .get<IProjectMetricsView>(`projects/${projectId}/metrics`);

        return res.data;
    }

    async getProjectTokenById(projectId: string): Promise<string> {
        const res = await this.instance
            .get<IProjectToken>(`projects/${projectId}/token`);

        return res.data.token;
    }

    async createProject(projectToCreate: IProjectToCreate): Promise<IProjectData> {
        const res = await this.instance
            .post<IProjectData>(
            'projects',
            projectToCreate
        );

        return res.data;
    }

    async updateProject(
        projectId: string, projectToUpdate: IProjectToUpdate
    ): Promise<IProjectData> {
        const res = await this.instance
            .put<IProjectData>(
            `projects/${projectId}`,
            projectToUpdate
        );

        return res.data;
    }

    async removeProject(projectId: string): Promise<void> {
        await this.instance.delete(`projects/${projectId}`);
    }

    async getAllProjectUsersById(projectId: string): Promise<IUserProject[]> {
        const res = await this.instance
            .get<IUserProject[]>(`projects/${projectId}/users`);

        return res.data;
    }

    async addUserToProjectByEmail(
        projectId: string, addUserEmail: string
    ): Promise<IUserProject> {
        const addUser: IUserProjectEmail = {
            email: addUserEmail,
        };
        const res = await this.instance
            .post<IUserProject>(
            `projects/${projectId}/users`,
            addUser
        );

        return res.data;
    }

    async removeUserFromProject(
        projectId: string, removeUserId: string
    ): Promise<void> {
        await this.instance
            .delete(`projects/${projectId}/users/${removeUserId}`);
    }

    async setProjectStatus(
        projectId: string, status: EProjectStatus
    ): Promise<void> {
        const project: IProjectStatus = {
            status,
        };
        await this.instance
            .post(
                `projects/${projectId}/status`,
                project
            );
    }

    async setProjectConnectorDefault(
        projectId: string, connectorDefaultId: string | null
    ): Promise<void> {
        const project: IProjectConnectorDefaultId = {
            connectorDefaultId,
        };
        await this.instance
            .post(
                `projects/${projectId}/default`,
                project
            );
    }

    async renewProjectToken(projectId: string): Promise<string> {
        const res = await this.instance
            .post<IProjectToken>(`projects/${projectId}/token`);

        return res.data.token;
    }

    //////////// CREDENTIALS ////////////
    async getAllProjectCredentials(
        projectId: string, type: string | null
    ): Promise<ICredentialView[]> {
        const params: any = {};

        if (type) {
            params.type = type;
        }

        const res = await this.instance.get<ICredentialView[]>(
            `projects/${projectId}/credentials`,
            {
                params,
            }
        );

        return res.data;
    }

    async getCredentialById(
        projectId: string, credentialId: string
    ): Promise<ICredentialData> {
        const res = await this.instance.get<ICredentialData>(`projects/${projectId}/credentials/${credentialId}`);

        return res.data;
    }

    async createCredential(
        projectId: string, credentialToCreate: ICredentialToCreate
    ): Promise<ICredentialView> {
        const res = await this.instance.post<ICredentialView>(
            `projects/${projectId}/credentials`,
            credentialToCreate
        );

        return res.data;
    }

    async createCredentialCallback(credentialToCreate: ICredentialToCreateCallback): Promise<ICredentialView> {
        const res = await this.instance.post<ICredentialView>(
            'credentials/callback',
            credentialToCreate
        );

        return res.data;
    }

    async updateCredential(
        projectId: string, credentialId: string, credentialToUpdate: ICredentialToUpdate
    ): Promise<ICredentialView> {
        const res = await this.instance.put<ICredentialView>(
            `projects/${projectId}/credentials/${credentialId}`,
            credentialToUpdate
        );

        return res.data;
    }

    async removeCredential(
        projectId: string, credentialId: string
    ): Promise<void> {
        await this.instance.delete(`projects/${projectId}/credentials/${credentialId}`);
    }

    async queryCredential(
        projectId: string, credentialId: string, query: ICredentialQuery
    ): Promise<any> {
        const res = await this.instance.post(
            `projects/${projectId}/credentials/${credentialId}/query`,
            query
        );

        return res.data;
    }

    //////////// CONNECTORS ////////////
    async getAllConnectorsTypes(): Promise<string[]> {
        const res = await this.instance.get<string[]>('connectors');

        return res.data;
    }

    async getAllProjectConnectorsAndProxiesById(projectId: string): Promise<IConnectorProxiesView[]> {
        const res = await this.instance.get<IConnectorProxiesView[]>(`projects/${projectId}/connectors`);

        return res.data;
    }

    async getAllConnectorProxiesById(
        projectId: string, connectorId: string
    ): Promise<IConnectorProxiesView> {
        const res = await this.instance.get<IConnectorProxiesView>(`projects/${projectId}/connectors/${connectorId}`);

        return res.data;
    }

    async getAllConnectorProxiesSyncById(
        projectId: string, connectorId: string
    ): Promise<IConnectorProxiesSync> {
        const res = await this.instance.get<IConnectorProxiesSync>(`projects/${projectId}/connectors/${connectorId}/sync`);

        return res.data;
    }

    async getConnectorById(
        projectId: string, connectorId: string
    ): Promise<IConnectorData> {
        const res = await this.instance
            .get<IConnectorData>(`projects/${projectId}/connectors/${connectorId}/update`);

        return res.data;
    }

    async createConnector(
        projectId: string, connectorToCreate: IConnectorToCreate
    ): Promise<IConnectorView> {
        const res = await this.instance
            .post<IConnectorView>(
            `projects/${projectId}/connectors`,
            connectorToCreate
        );

        return res.data;
    }

    async updateConnector(
        projectId: string, connectorId: string, connectorToUpdate: IConnectorToUpdate
    ): Promise<IConnectorView> {
        const res = await this.instance
            .put(
                `projects/${projectId}/connectors/${connectorId}`,
                connectorToUpdate
            );

        return res.data;
    }

    async removeConnector(
        projectId: string, connectorId: string
    ): Promise<void> {
        await this.instance
            .delete(`projects/${projectId}/connectors/${connectorId}`);
    }

    async scaleConnector(
        projectId: string, connectorId: string, proxiesMax: number
    ): Promise<void> {
        const connector: IConnectorScale = {
            proxiesMax,
        };
        await this.instance
            .post(
                `projects/${projectId}/connectors/${connectorId}/scale`,
                connector
            );
    }

    async activateConnector(
        projectId: string, connectorId: string, active: boolean
    ): Promise<void> {
        const connector: IConnectorActive = {
            active,
        };
        await this.instance
            .post(
                `projects/${projectId}/connectors/${connectorId}/activate`,
                connector
            );
    }

    async installConnector(
        projectId: string, connectorId: string, connectorToInstall: IConnectorToInstall
    ): Promise<ITaskView> {
        const res = await this.instance
            .post<ITaskView>(
            `projects/${projectId}/connectors/${connectorId}/install`,
            connectorToInstall
        );

        return res.data;
    }

    async uninstallConnector(
        projectId: string, connectorId: string
    ): Promise<ITaskView> {
        const res = await this.instance
            .post<ITaskView>(`projects/${projectId}/connectors/${connectorId}/uninstall`);

        return res.data;
    }

    async validateConnector(
        projectId: string, connectorId: string
    ): Promise<void> {
        await this.instance
            .post(
                `projects/${projectId}/connectors/${connectorId}/install/validate`,
                {}
            );
    }

    async renewConnectorCertificate(
        projectId: string,
        connectorId: string,
        durationInMs: number
    ): Promise<void> {
        const certificateToRenew: ICertificateToRenew = {
            durationInMs,
        };

        await this.instance
            .post(
                `projects/${projectId}/connectors/${connectorId}/certificate`,
                certificateToRenew
            );
    }

    //////////// PROXIES ////////////
    async askProxiesToRemove(
        projectId: string, proxiesIds: IProxyIdToRemove[]
    ): Promise<void> {
        await this.instance
            .post(
                `projects/${projectId}/proxies/remove`,
                proxiesIds
            );
    }

    //////////// FREE PROXIES ////////////
    async getAllProjectSourcesAndFreeproxiesById(
        projectId: string, connectorId: string
    ): Promise<ISourcesAndFreeproxies> {
        const res = await this.instance.get<ISourcesAndFreeproxies>(`projects/${projectId}/connectors/${connectorId}/sourcesfreeproxies`);

        return res.data;
    }

    async createFreeproxies(
        projectId: string,
        connectorId: string,
        freeproxies: IFreeproxyBase[]
    ): Promise<void> {
        await this.instance
            .post(
                `projects/${projectId}/connectors/${connectorId}/freeproxies/create`,
                freeproxies
            );
    }

    async removeFreeproxies(
        projectId: string,
        connectorId: string,
        options: IFreeproxiesToRemoveOptions
    ): Promise<void> {
        await this.instance
            .post(
                `projects/${projectId}/connectors/${connectorId}/freeproxies/remove`,
                options
            );
    }

    async createSources(
        projectId: string,
        connectorId: string,
        sources: ISourceBase[]
    ): Promise<void> {
        await this.instance
            .post(
                `projects/${projectId}/connectors/${connectorId}/sources`,
                sources
            );
    }

    async removeSources(
        projectId: string,
        connectorId: string,
        ids: string[]
    ): Promise<void> {
        await this.instance
            .post(
                `projects/${projectId}/connectors/${connectorId}/sources/remove`,
                ids
            );
    }

    //////////// TASKS ////////////
    async getAllProjectTasksById(projectId: string): Promise<ITaskView[]> {
        const res = await this.instance.get<ITaskView[]>(`projects/${projectId}/tasks`);

        return res.data;
    }

    async getTaskById(
        projectId: string, taskId: string
    ): Promise<ITaskView> {
        const res = await this.instance.get<ITaskView>(`projects/${projectId}/tasks/${taskId}`);

        return res.data;
    }

    async removeTask(
        projectId: string, taskId: string
    ): Promise<void> {
        await this.instance
            .delete(`projects/${projectId}/tasks/${taskId}`);
    }

    async cancelTask(
        projectId: string, taskId: string
    ): Promise<void> {
        await this.instance
            .post(
                `projects/${projectId}/tasks/${taskId}/cancel`,
                {}
            );
    }
}
