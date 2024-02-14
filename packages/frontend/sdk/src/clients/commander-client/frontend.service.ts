import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EProjectStatus } from '@scrapoxy/common';
import { lastValueFrom } from 'rxjs';
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


@Injectable()
export class CommanderFrontendClientService implements ICommanderFrontendClient {
    private readonly baseUrl = 'api/frontend';

    constructor(private readonly client: HttpClient) {}

    //////////// PROJECTS ////////////
    async getAllProjectsForUserId(): Promise<IProjectView[]> {
        const res = await lastValueFrom(this.client.get<IProjectView[]>(`${this.baseUrl}/projects`));

        return res;
    }

    async getProjectById(projectId: string): Promise<IProjectData> {
        const res = await lastValueFrom(this.client
            .get<IProjectData>(`${this.baseUrl}/projects/${projectId}`));

        return res;
    }

    async getProjectMetricsById(projectId: string): Promise<IProjectMetricsView> {
        const res = await lastValueFrom(this.client
            .get<IProjectMetricsView>(`${this.baseUrl}/projects/${projectId}/metrics`));

        return res;
    }

    async getProjectTokenById(projectId: string): Promise<string> {
        const res = await lastValueFrom(this.client
            .get<IProjectToken>(`${this.baseUrl}/projects/${projectId}/token`));

        return res.token;
    }

    async createProject(projectToCreate: IProjectToCreate): Promise<IProjectData> {
        const res = await lastValueFrom(this.client
            .post<IProjectData>(
            `${this.baseUrl}/projects`,
            projectToCreate
        ));

        return res;
    }

    async updateProject(
        projectId: string, projectToUpdate: IProjectToUpdate
    ): Promise<IProjectData> {
        const res = await lastValueFrom(this.client
            .put<IProjectData>(
            `${this.baseUrl}/projects/${projectId}`,
            projectToUpdate
        ));

        return res;
    }

    async removeProject(projectId: string): Promise<void> {
        await lastValueFrom(this.client.delete(`${this.baseUrl}/projects/${projectId}`));
    }

    async getAllProjectUsersById(projectId: string): Promise<IUserProject[]> {
        const res = await lastValueFrom(this.client
            .get<IUserProject[]>(`${this.baseUrl}/projects/${projectId}/users`));

        return res;
    }

    async addUserToProjectByEmail(
        projectId: string, addUserEmail: string
    ): Promise<IUserProject> {
        const addUser: IUserProjectEmail = {
            email: addUserEmail,
        };
        const res = await lastValueFrom(this.client
            .post<IUserProject>(
            `${this.baseUrl}/projects/${projectId}/users`,
            addUser
        ));

        return res;
    }

    async removeUserFromProject(
        projectId: string, removeUserId: string
    ): Promise<void> {
        await lastValueFrom(this.client
            .delete(`${this.baseUrl}/projects/${projectId}/users/${removeUserId}`));
    }

    async setProjectStatus(
        projectId: string, status: EProjectStatus
    ): Promise<void> {
        const project: IProjectStatus = {
            status,
        };
        await lastValueFrom(this.client
            .post(
                `${this.baseUrl}/projects/${projectId}/status`,
                project
            ));
    }

    async setProjectConnectorDefault(
        projectId: string, connectorDefaultId: string | null
    ): Promise<void> {
        const project: IProjectConnectorDefaultId = {
            connectorDefaultId,
        };
        await lastValueFrom(this.client
            .post(
                `${this.baseUrl}/projects/${projectId}/default`,
                project
            ));
    }

    async renewProjectToken(projectId: string): Promise<string> {
        const res = await lastValueFrom(this.client
            .post<IProjectToken>(
            `${this.baseUrl}/projects/${projectId}/token`,
            void 0
        ));

        return res.token;
    }

    //////////// CREDENTIALS ////////////
    async getAllProjectCredentials(
        projectId: string, type: string | null
    ): Promise<ICredentialView[]> {
        const params: any = {};

        if (type) {
            params.type = type;
        }

        const res = await lastValueFrom(this.client
            .get<ICredentialView[]>(
            `${this.baseUrl}/projects/${projectId}/credentials`,
            {
                params,
            }
        ));

        return res;
    }

    async getAllProjectCredentialsNames(projectId: string): Promise<string[]> {
        const res = await lastValueFrom(this.client
            .get<string[]>(`${this.baseUrl}/projects/${projectId}/credentials/names`));

        return res;
    }

    async getCredentialById(
        projectId: string, credentialId: string
    ): Promise<ICredentialData> {
        const res = await lastValueFrom(this.client
            .get<ICredentialData>(`${this.baseUrl}/projects/${projectId}/credentials/${credentialId}`));

        return res;
    }

    async createCredential(
        projectId: string, credentialToCreate: ICredentialToCreate
    ): Promise<ICredentialView> {
        const res = await lastValueFrom(this.client
            .post<ICredentialView>(
            `${this.baseUrl}/projects/${projectId}/credentials`,
            credentialToCreate
        ));

        return res;
    }

    async createCredentialCallback(credentialToCreate: ICredentialToCreateCallback): Promise<ICredentialView> {
        const res = await lastValueFrom(this.client
            .post<ICredentialView>(
            `${this.baseUrl}/credentials/callback`,
            credentialToCreate
        ));

        return res;
    }

    async updateCredential(
        projectId: string, credentialId: string, credentialToUpdate: ICredentialToUpdate
    ): Promise<ICredentialView> {
        const res = await lastValueFrom(this.client
            .put<ICredentialView>(
            `${this.baseUrl}/projects/${projectId}/credentials/${credentialId}`,
            credentialToUpdate
        ));

        return res;
    }

    async removeCredential(
        projectId: string, credentialId: string
    ): Promise<void> {
        await lastValueFrom(this.client
            .delete(`${this.baseUrl}/projects/${projectId}/credentials/${credentialId}`));
    }

    async queryCredential(
        projectId: string, credentialId: string, query: ICredentialQuery
    ): Promise<any> {
        const res = await lastValueFrom(this.client
            .post<any>(
            `${this.baseUrl}/projects/${projectId}/credentials/${credentialId}/query`,
            query
        ));

        return res;
    }

    //////////// CONNECTORS ////////////
    async getAllConnectorsTypes(): Promise<string[]> {
        const res = await lastValueFrom(this.client
            .get<string[]>(`${this.baseUrl}/connectors`));

        return res;
    }

    async getAllProjectConnectorsAndProxiesById(projectId: string): Promise<IConnectorProxiesView[]> {
        const res = await lastValueFrom(this.client
            .get<IConnectorProxiesView[]>(`${this.baseUrl}/projects/${projectId}/connectors`));

        return res;
    }

    async getAllProjectConnectorsNames(projectId: string): Promise<string[]> {
        const res = await lastValueFrom(this.client
            .get<string[]>(`${this.baseUrl}/projects/${projectId}/connectors/names`));

        return res;
    }

    async getAllConnectorProxiesById(
        projectId: string, connectorId: string
    ): Promise<IConnectorProxiesView> {
        const res = await lastValueFrom(this.client
            .get<IConnectorProxiesView>(`${this.baseUrl}/projects/${projectId}/connectors/${connectorId}`));

        return res;
    }

    async getAllConnectorProxiesSyncById(
        projectId: string, connectorId: string
    ): Promise<IConnectorProxiesSync> {
        const res = await lastValueFrom(this.client
            .get<IConnectorProxiesSync>(`${this.baseUrl}/projects/${projectId}/connectors/${connectorId}/sync`));

        return res;
    }

    async getConnectorById(
        projectId: string, connectorId: string
    ): Promise<IConnectorData> {
        const res = await lastValueFrom(this.client.get<IConnectorData>(`${this.baseUrl}/projects/${projectId}/connectors/${connectorId}/update`));

        return res;
    }

    async createConnector(
        projectId: string, connectorToCreate: IConnectorToCreate
    ): Promise<IConnectorView> {
        const res = await lastValueFrom(this.client
            .post<IConnectorView>(
            `${this.baseUrl}/projects/${projectId}/connectors`,
            connectorToCreate
        ));

        return res;
    }

    async updateConnector(
        projectId: string, connectorId: string, connectorToUpdate: IConnectorToUpdate
    ): Promise<IConnectorView> {
        const res = await lastValueFrom(this.client
            .put<IConnectorView>(
            `${this.baseUrl}/projects/${projectId}/connectors/${connectorId}`,
            connectorToUpdate
        ));

        return res;
    }

    async removeConnector(
        projectId: string, connectorId: string
    ): Promise<void> {
        await lastValueFrom(this.client
            .delete(`${this.baseUrl}/projects/${projectId}/connectors/${connectorId}`));
    }

    async scaleConnector(
        projectId: string, connectorId: string, proxiesMax: number
    ): Promise<void> {
        const connector: IConnectorScale = {
            proxiesMax,
        };
        await lastValueFrom(this.client
            .post(
                `${this.baseUrl}/projects/${projectId}/connectors/${connectorId}/scale`,
                connector
            ));
    }

    async activateConnector(
        projectId: string, connectorId: string, active: boolean
    ): Promise<void> {
        const connector: IConnectorActive = {
            active,
        };
        await lastValueFrom(this.client
            .post(
                `${this.baseUrl}/projects/${projectId}/connectors/${connectorId}/activate`,
                connector
            ));
    }

    async installConnector(
        projectId: string, connectorId: string, connectorToInstall: IConnectorToInstall
    ): Promise<ITaskView> {
        const res = await lastValueFrom(this.client
            .post<ITaskView>(
            `${this.baseUrl}/projects/${projectId}/connectors/${connectorId}/install`,
            connectorToInstall
        ));

        return res;
    }

    async uninstallConnector(
        projectId: string, connectorId: string
    ): Promise<ITaskView> {
        const res = await lastValueFrom(this.client
            .post<ITaskView>(
            `${this.baseUrl}/projects/${projectId}/connectors/${connectorId}/uninstall`,
            {}
        ));

        return res;
    }

    async validateConnector(
        projectId: string, connectorId: string
    ): Promise<void> {
        await lastValueFrom(this.client
            .post(
                `${this.baseUrl}/projects/${projectId}/connectors/${connectorId}/install/validate`,
                {}
            ));
    }

    async renewConnectorCertificate(
        projectId: string,
        connectorId: string,
        durationInMs: number
    ): Promise<void> {
        const certificateToRenew: ICertificateToRenew = {
            durationInMs,
        };

        await lastValueFrom(this.client
            .post(
                `${this.baseUrl}/projects/${projectId}/connectors/${connectorId}/certificate`,
                certificateToRenew
            ));
    }

    //////////// PROXIES ////////////
    async askProxiesToRemove(
        projectId: string, proxiesIds: IProxyIdToRemove[]
    ): Promise<void> {
        await lastValueFrom(this.client
            .post(
                `${this.baseUrl}/projects/${projectId}/proxies/remove`,
                proxiesIds
            ));
    }

    //////////// FREE PROXIES ////////////
    async getAllProjectSourcesAndFreeproxiesById(
        projectId: string, connectorId: string
    ): Promise<ISourcesAndFreeproxies> {
        const res = await lastValueFrom(this.client
            .get<ISourcesAndFreeproxies>(
            `${this.baseUrl}/projects/${projectId}/connectors/${connectorId}/sourcesfreeproxies`,
            {}
        ));

        return res;
    }

    async createFreeproxies(
        projectId: string,
        connectorId: string,
        freeproxies: IFreeproxyBase[]
    ): Promise<void> {
        await lastValueFrom(this.client
            .post(
                `${this.baseUrl}/projects/${projectId}/connectors/${connectorId}/freeproxies/create`,
                freeproxies
            ));
    }

    async removeFreeproxies(
        projectId: string,
        connectorId: string,
        options?: IFreeproxiesToRemoveOptions
    ): Promise<void> {
        await lastValueFrom(this.client
            .post(
                `${this.baseUrl}/projects/${projectId}/connectors/${connectorId}/freeproxies/remove`,
                options
            ));
    }

    async createSources(
        projectId: string,
        connectorId: string,
        sources: ISourceBase[]
    ): Promise<void> {
        await lastValueFrom(this.client
            .post(
                `${this.baseUrl}/projects/${projectId}/connectors/${connectorId}/sources`,
                sources
            ));
    }

    async removeSources(
        projectId: string,
        connectorId: string,
        ids: string[]
    ): Promise<void> {
        await lastValueFrom(this.client
            .post(
                `${this.baseUrl}/projects/${projectId}/connectors/${connectorId}/sources/remove`,
                ids
            ));
    }

    //////////// TASKS ////////////
    async getAllProjectTasksById(projectId: string): Promise<ITaskView[]> {
        const res = await lastValueFrom(this.client
            .get<ITaskView[]>(`${this.baseUrl}/projects/${projectId}/tasks`));

        return res;
    }

    async getTaskById(
        projectId: string, taskId: string
    ): Promise<ITaskView> {
        const res = await lastValueFrom(this.client.get<ITaskView>(`${this.baseUrl}/projects/${projectId}/tasks/${taskId}`));

        return res;
    }

    async removeTask(
        projectId: string, taskId: string
    ): Promise<void> {
        await lastValueFrom(this.client
            .delete(
                `${this.baseUrl}/projects/${projectId}/tasks/${taskId}`,
                {}
            ));
    }

    async cancelTask(
        projectId: string, taskId: string
    ): Promise<void> {
        await lastValueFrom(this.client
            .post(
                `${this.baseUrl}/projects/${projectId}/tasks/${taskId}/cancel`,
                {}
            ));
    }
}
