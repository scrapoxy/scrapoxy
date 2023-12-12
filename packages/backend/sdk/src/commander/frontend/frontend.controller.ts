import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    Param,
    Post,
    Put,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { CommanderFrontendService } from './frontend.service';
import { CommanderFrontendRoleGuard } from './role.guard';
import { CommanderFrontendTokenGuard } from './token.guard';
import { ConnectorprovidersService } from '../../connectors';
import type {
    IRequestToken,
    IRequestUser,
} from '../commander.interface';
import type {
    ICertificateToRenew,
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
    IFreeproxy,
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
    ITaskView,
    IUserProject,
    IUserProjectEmail,
} from '@scrapoxy/common';


@Controller('api/frontend')
@UseGuards(CommanderFrontendTokenGuard)
export class CommanderFrontendController {
    constructor(
        private readonly connectorproviders: ConnectorprovidersService,
        private readonly commander: CommanderFrontendService
    ) {}

    //////////// PROJECTS ////////////
    @Get('projects')
    async getAllProjectsForUserId(@Req() req: IRequestUser): Promise<IProjectView[]> {
        const projects = await this.commander.getAllProjectsForUserId(req.user.id);

        return projects;
    }

    @Get('projects/:projectId')
    @UseGuards(CommanderFrontendRoleGuard)
    async getProjectById(@Param('projectId') projectId: string): Promise<IProjectData> {
        const project = await this.commander.getProjectById(projectId);

        return project;
    }

    @Get('projects/:projectId/metrics')
    @UseGuards(CommanderFrontendRoleGuard)
    async getProjectMetricsById(@Param('projectId') projectId: string): Promise<IProjectMetricsView> {
        const view = await this.commander.getProjectMetricsById(projectId);

        return view;
    }

    @Get('projects/:projectId/token')
    @UseGuards(CommanderFrontendRoleGuard)
    async getProjectTokenById(@Param('projectId') projectId: string): Promise<IProjectToken> {
        const token = await this.commander.getProjectTokenById(projectId);
        const project: IProjectToken = {
            token,
        };

        return project;
    }

    @Post('projects')
    async createProject(
        @Req() req: IRequestUser, @Body() projectToCreate: IProjectToCreate
    ): Promise<IProjectData> {
        const project = await this.commander.createProject(
            req.user.id,
            projectToCreate
        );

        return project;
    }

    @Put('projects/:projectId')
    @UseGuards(CommanderFrontendRoleGuard)
    async updateProject(
        @Param('projectId') projectId: string,
            @Body() projectToUpdate: IProjectToUpdate
    ): Promise<IProjectData> {
        const project = await this.commander.updateProject(
            projectId,
            projectToUpdate
        );

        return project;
    }

    @Delete('projects/:projectId')
    @HttpCode(204)
    @UseGuards(CommanderFrontendRoleGuard)
    async removeProject(@Param('projectId') projectId: string): Promise<void> {
        await this.commander.removeProject(projectId);
    }

    @Get('projects/:projectId/users')
    @UseGuards(CommanderFrontendRoleGuard)
    async getAllProjectUsersById(@Param('projectId') projectId: string): Promise<IUserProject[]> {
        const users = await this.commander.getAllProjectUsersById(projectId);

        return users;
    }

    @Post('projects/:projectId/users')
    @UseGuards(CommanderFrontendRoleGuard)
    async addUserToProjectByEmail(
        @Req() req: IRequestUser,
            @Param('projectId') projectId: string,
            @Body() addUser: IUserProjectEmail
    ): Promise<IUserProject> {
        const addedUser = await this.commander.addUserToProjectByEmail(
            req.user.id,
            projectId,
            addUser.email
        );

        return addedUser;
    }

    @Delete('projects/:projectId/users/:userId')
    @HttpCode(204)
    @UseGuards(CommanderFrontendRoleGuard)
    async removeUserFromProject(
        @Req() req: IRequestUser,
            @Param('projectId') projectId: string,
            @Param('userId') removeUserId: string
    ): Promise<void> {
        await this.commander.removeUserFromProject(
            req.user.id,
            projectId,
            removeUserId
        );
    }

    @Post('projects/:projectId/status')
    @HttpCode(204)
    @UseGuards(CommanderFrontendRoleGuard)
    async setProjectStatus(
        @Param('projectId') projectId: string,
            @Body() project: IProjectStatus
    ): Promise<void> {
        await this.commander.setProjectStatus(
            projectId,
            project.status
        );
    }

    @Post('projects/:projectId/default')
    @HttpCode(204)
    @UseGuards(CommanderFrontendRoleGuard)
    async setProjectConnectorDefault(
        @Param('projectId') projectId: string,
            @Body() project: IProjectConnectorDefaultId
    ): Promise<void> {
        await this.commander.setProjectConnectorDefault(
            projectId,
            project.connectorDefaultId
        );
    }

    @Post('projects/:projectId/token')
    @UseGuards(CommanderFrontendRoleGuard)
    async renewProjectToken(@Param('projectId') projectId: string): Promise<IProjectToken> {
        const token = await this.commander.renewProjectToken(projectId);
        const project: IProjectToken = {
            token,
        };

        return project;
    }

    //////////// CREDENTIALS ////////////
    @Get('projects/:projectId/credentials')
    @UseGuards(CommanderFrontendRoleGuard)
    async getAllProjectCredentials(
        @Param('projectId') projectId: string,
            @Query('type') type: string
    ): Promise<ICredentialView[]> {
        const credentials = await this.commander.getAllProjectCredentials(
            projectId,
            type && type.length > 0 ? type : null
        );

        return credentials;
    }

    @Get('projects/:projectId/credentials/:credentialId')
    @UseGuards(CommanderFrontendRoleGuard)
    async getCredentialById(
        @Param('projectId') projectId: string,
            @Param('credentialId') credentialId: string
    ): Promise<ICredentialData> {
        const credential = await this.commander.getCredentialById(
            projectId,
            credentialId
        );

        return credential;
    }

    @Post('projects/:projectId/credentials')
    @UseGuards(CommanderFrontendRoleGuard)
    async createCredential(
        @Param('projectId') projectId: string,
            @Body() credentialToCreate: ICredentialToCreate
    ): Promise<ICredentialView> {
        const credential = await this.commander.createCredential(
            projectId,
            credentialToCreate
        );

        return credential;
    }

    @Post('credentials/callback')
    @UseGuards(CommanderFrontendRoleGuard)
    async createCredentialCallback(@Body() credentialToCreate: ICredentialToCreateCallback): Promise<ICredentialView> {
        const credential = await this.commander.createCredentialCallback(credentialToCreate);

        return credential;
    }

    @Put('projects/:projectId/credentials/:credentialId')
    @UseGuards(CommanderFrontendRoleGuard)
    async updateCredential(
        @Param('projectId') projectId: string,
            @Param('credentialId') credentialId: string,
            @Body() credentialToUpdate: ICredentialToUpdate
    ): Promise<ICredentialView> {
        const credential = await this.commander.updateCredential(
            projectId,
            credentialId,
            credentialToUpdate
        );

        return credential;
    }

    @Delete('projects/:projectId/credentials/:credentialId')
    @HttpCode(204)
    @UseGuards(CommanderFrontendRoleGuard)
    async removeCredential(
        @Param('projectId') projectId: string,
            @Param('credentialId') credentialId: string
    ): Promise<void> {
        await this.commander.removeCredential(
            projectId,
            credentialId
        );
    }

    @Post('projects/:projectId/credentials/:credentialId/query')
    @HttpCode(200)
    @UseGuards(CommanderFrontendRoleGuard)
    async queryCredential(
        @Param('projectId') projectId: string,
            @Param('credentialId') credentialId: string,
            @Body() query: ICredentialQuery
    ): Promise<any> {
        const res = await this.commander.queryCredential(
            projectId,
            credentialId,
            query
        );

        return res;
    }

    //////////// CONNECTORS ////////////
    @Get('connectors')
    async getAllConnectorsTypes(): Promise<string[]> {
        return this.connectorproviders.getAllTypes();
    }

    @Get('projects/:projectId/connectors')
    @UseGuards(CommanderFrontendRoleGuard)
    async getAllProjectConnectorsAndProxiesById(@Param('projectId') projectId: string): Promise<IConnectorProxiesView[]> {
        const connectors = await this.commander.getAllProjectConnectorsAndProxiesById(projectId);

        return connectors;
    }

    @Get('projects/:projectId/connectors/:connectorId')
    @UseGuards(CommanderFrontendRoleGuard)
    async getAllConnectorProxiesById(
        @Param('projectId') projectId: string,
            @Param('connectorId') connectorId: string
    ): Promise<IConnectorProxiesView> {
        const connectors = await this.commander.getAllConnectorProxiesById(
            projectId,
            connectorId
        );

        return connectors;
    }

    @Get('projects/:projectId/connectors/:connectorId/sync')
    @UseGuards(CommanderFrontendRoleGuard)
    async getAllConnectorProxiesSyncById(
        @Param('projectId') projectId: string,
            @Param('connectorId') connectorId: string
    ): Promise<IConnectorProxiesSync> {
        const connectors = await this.commander.getAllConnectorProxiesSyncById(
            projectId,
            connectorId
        );

        return connectors;
    }

    @Get('projects/:projectId/connectors/:connectorId/edit')
    @UseGuards(CommanderFrontendRoleGuard)
    async getConnectorById(
        @Param('projectId') projectId: string,
            @Param('connectorId') connectorId: string
    ): Promise<IConnectorData> {
        const connector = await this.commander.getConnectorById(
            projectId,
            connectorId
        );

        return connector;
    }

    @Post('projects/:projectId/connectors')
    @UseGuards(CommanderFrontendRoleGuard)
    async createConnector(
        @Param('projectId') projectId: string,
            @Body() connectorToCreate: IConnectorToCreate
    ): Promise<IConnectorView> {
        const connector = await this.commander.createConnector(
            projectId,
            connectorToCreate
        );

        return connector;
    }

    @Put('projects/:projectId/connectors/:connectorId')
    @UseGuards(CommanderFrontendRoleGuard)
    async updateConnector(
        @Param('projectId') projectId: string,
            @Param('connectorId') connectorId: string,
            @Body() connectorToUpdate: IConnectorToUpdate
    ): Promise<IConnectorView> {
        const connector = await this.commander.updateConnector(
            projectId,
            connectorId,
            connectorToUpdate
        );

        return connector;
    }

    @Delete('projects/:projectId/connectors/:connectorId')
    @HttpCode(204)
    @UseGuards(CommanderFrontendRoleGuard)
    async removeConnector(
        @Param('projectId') projectId: string,
            @Param('connectorId') connectorId: string
    ): Promise<void> {
        await this.commander.removeConnector(
            projectId,
            connectorId
        );
    }

    @Post('projects/:projectId/connectors/:connectorId/scale')
    @HttpCode(204)
    @UseGuards(CommanderFrontendRoleGuard)
    async scaleConnector(
        @Param('projectId') projectId: string,
            @Param('connectorId') connectorId: string,
            @Body() connector: IConnectorScale
    ): Promise<void> {
        await this.commander.scaleConnector(
            projectId,
            connectorId,
            connector.proxiesMax
        );
    }

    @Post('projects/:projectId/connectors/:connectorId/activate')
    @HttpCode(204)
    @UseGuards(CommanderFrontendRoleGuard)
    async activateConnector(
        @Param('projectId') projectId: string,
            @Param('connectorId') connectorId: string,
            @Body() connector: IConnectorActive
    ): Promise<void> {
        await this.commander.activateConnector(
            projectId,
            connectorId,
            connector.active
        );
    }

    @Post('projects/:projectId/connectors/:connectorId/install')
    @UseGuards(CommanderFrontendRoleGuard)
    async installConnector(
        @Req() req: IRequestToken,
            @Param('projectId') projectId: string,
            @Param('connectorId') connectorId: string,
            @Body() connectorToInstall: IConnectorToInstall
    ): Promise<ITaskView> {
        const task = await this.commander.installConnector(
            projectId,
            connectorId,
            req.token,
            connectorToInstall
        );

        return task;
    }

    @Post('projects/:projectId/connectors/:connectorId/uninstall')
    @UseGuards(CommanderFrontendRoleGuard)
    async uninstallConnector(
        @Req() req: IRequestToken,
            @Param('projectId') projectId: string,
            @Param('connectorId') connectorId: string
    ): Promise<ITaskView> {
        const task = await this.commander.uninstallConnector(
            projectId,
            connectorId,
            req.token
        );

        return task;
    }

    @Post('projects/:projectId/connectors/:connectorId/install/validate')
    @HttpCode(204)
    @UseGuards(CommanderFrontendRoleGuard)
    async validateConnector(
        @Param('projectId') projectId: string,
            @Param('connectorId') connectorId: string
    ): Promise<void> {
        await this.commander.validateConnector(
            projectId,
            connectorId
        );
    }

    @Post('projects/:projectId/connectors/:connectorId/certificate')
    @HttpCode(204)
    @UseGuards(CommanderFrontendRoleGuard)
    async renewConnectorCertificate(
        @Param('projectId') projectId: string,
            @Param('connectorId') connectorId: string,
            @Body() certificateToRenew: ICertificateToRenew
    ): Promise<void> {
        await this.commander.renewConnectorCertificate(
            projectId,
            connectorId,
            certificateToRenew.durationInMs
        );
    }

    //////////// PROXIES ////////////
    @Post('projects/:projectId/proxies/remove')
    @UseGuards(CommanderFrontendRoleGuard)
    async askProxiesToRemove(
        @Param('projectId') projectId: string,
            @Body() proxiesIds: IProxyIdToRemove[]
    ): Promise<void> {
        await this.commander.askProxiesToRemove(
            projectId,
            proxiesIds
        );
    }

    //////////// FREE PROXIES ////////////
    @Get('projects/:projectId/connectors/:connectorId/freeproxies/all')
    @UseGuards(CommanderFrontendRoleGuard)
    async getAllProjectFreeproxiesById(
        @Param('projectId') projectId: string,
            @Param('connectorId') connectorId: string
    ): Promise<IFreeproxy[]> {
        const freeproxies = await this.commander.getAllProjectFreeproxiesById(
            projectId,
            connectorId
        );

        return freeproxies;
    }

    @Post('projects/:projectId/connectors/:connectorId/freeproxies/create')
    @HttpCode(204)
    @UseGuards(CommanderFrontendRoleGuard)
    async createFreeproxies(
        @Param('projectId') projectId: string,
            @Param('connectorId') connectorId: string,
            @Body() freeproxies: IFreeproxyBase[]
    ): Promise<void> {
        await this.commander.createFreeproxies(
            projectId,
            connectorId,
            freeproxies
        );
    }

    @Post('projects/:projectId/connectors/:connectorId/freeproxies/remove')
    @HttpCode(204)
    @UseGuards(CommanderFrontendRoleGuard)
    async removeFreeproxies(
        @Param('projectId') projectId: string,
            @Param('connectorId') connectorId: string,
            @Body() options: IFreeproxiesToRemoveOptions
    ): Promise<void> {
        await this.commander.removeFreeproxies(
            projectId,
            connectorId,
            options
        );
    }

    //////////// TASKS ////////////
    @Get('projects/:projectId/tasks')
    @UseGuards(CommanderFrontendRoleGuard)
    async getAllProjectTasksById(@Param('projectId') projectId: string): Promise<ITaskView[]> {
        const tasks = await this.commander.getAllProjectTasksById(projectId);

        return tasks;
    }

    @Get('projects/:projectId/tasks/:taskId')
    @UseGuards(CommanderFrontendRoleGuard)
    async getTaskById(
        @Param('projectId') projectId: string,
            @Param('taskId') taskId: string
    ): Promise<ITaskView> {
        const task = await this.commander.getTaskById(
            projectId,
            taskId
        );

        return task;
    }

    @Delete('projects/:projectId/tasks/:taskId')
    @HttpCode(204)
    @UseGuards(CommanderFrontendRoleGuard)
    async removeTask(
        @Param('projectId') projectId: string,
            @Param('taskId') taskId: string
    ): Promise<void> {
        await this.commander.removeTask(
            projectId,
            taskId
        );
    }

    @Post('projects/:projectId/tasks/:taskId/cancel')
    @HttpCode(204)
    @UseGuards(CommanderFrontendRoleGuard)
    async cancelTask(
        @Param('projectId') projectId: string,
            @Param('taskId') taskId: string
    ): Promise<void> {
        await this.commander.cancelTask(
            projectId,
            taskId
        );
    }
}
