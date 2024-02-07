import {
    Body,
    Controller,
    Get,
    HttpCode,
    Param,
    Post,
    Put,
    UseGuards,
} from '@nestjs/common';
import { CommanderRefreshService } from './refresh.service';
import { CommanderRefreshTokenGuard } from './token.guard';
import type {
    IConnectorError,
    IConnectorProxyRefreshed,
    IConnectorToRefresh,
    ICreateRemoveLocalProxies,
    IFreeproxiesToRefresh,
    IFreeproxy,
    IFreeproxyBase,
    IFreeproxyRefreshed,
    INewFreeProxies,
    IProxiesToRefresh,
    IProxyMetricsAdd,
    IProxyRefreshed,
    ISelectedFreeproxies,
    ISource,
    ISourceRefreshed,
    ISynchronizeRemoteProxies,
    ITaskData,
    ITaskToUpdate,
    ITaskView,
} from '@scrapoxy/common';


@Controller('api/refresh')
@UseGuards(CommanderRefreshTokenGuard)
export class CommanderRefreshController {
    constructor(private readonly commander: CommanderRefreshService) {}

    //////////// PROJECTS ////////////
    @Post('projects/metrics')
    @HttpCode(204)
    async refreshProjectMetrics(): Promise<void> {
        await this.commander.refreshProjectMetrics();
    }

    //////////// CONNECTORS ////////////
    @Post('projects/:projectId/connectors/:connectorId/error')
    async setConnectorError(
        @Param('projectId') projectId: string,
            @Param('connectorId') connectorId: string,
            @Body() connector: IConnectorError
    ): Promise<void> {
        await this.commander.setConnectorError(
            projectId,
            connectorId,
            connector.error
        );
    }

    @Get('connectors/refresh')
    async getNextConnectorToRefresh(): Promise<IConnectorToRefresh> {
        const connector = await this.commander.getNextConnectorToRefresh();

        return connector;
    }

    @Put('projects/:projectId/connectors/:connectorId/proxies')
    async createAndRemoveConnectorProxies(
        @Param('projectId') projectId: string,
            @Param('connectorId') connectorId: string,
            @Body() proxies: ICreateRemoveLocalProxies
    ): Promise<void> {
        await this.commander.createAndRemoveConnectorProxies(
            projectId,
            connectorId,
            proxies
        );
    }

    @Post('projects/:projectId/connectors/:connectorId/proxies')
    async refreshConnectorProxies(
        @Param('projectId') projectId: string,
            @Param('connectorId') connectorId: string,
            @Body() proxies: IConnectorProxyRefreshed[]
    ): Promise<ISynchronizeRemoteProxies> {
        const actions = await this.commander.refreshConnectorProxies(
            projectId,
            connectorId,
            proxies
        );

        return actions;
    }

    //////////// PROXIES ////////////
    @Post('proxies/refresh')
    @HttpCode(204)
    async refreshProxies(@Body() remoteProxies: IProxyRefreshed[]): Promise<void> {
        await this.commander.refreshProxies(remoteProxies);
    }

    @Post('proxies/metrics')
    @HttpCode(204)
    async addProxiesMetrics(@Body() proxies: IProxyMetricsAdd[]): Promise<void> {
        await this.commander.addProxiesMetrics(proxies);
    }

    @Get('proxies/refresh')
    async getNextProxiesToRefresh(): Promise<IProxiesToRefresh> {
        const proxies = await this.commander.getNextProxiesToRefresh();

        return proxies;
    }

    //////////// FREE PROXIES ////////////
    @Post('projects/:projectId/connectors/:connectorId/freeproxies/selected')
    async getSelectedProjectFreeproxies(
        @Param('projectId') projectId: string,
            @Param('connectorId') connectorId: string,
            @Body() query: ISelectedFreeproxies
    ): Promise<IFreeproxy[]> {
        const freeproxies = await this.commander.getSelectedProjectFreeproxies(
            projectId,
            connectorId,
            query.keys
        );

        return freeproxies;
    }

    @Post('projects/:projectId/connectors/:connectorId/freeproxies/new')
    async getNewProjectFreeproxies(
        @Param('projectId') projectId: string,
            @Param('connectorId') connectorId: string,
            @Body() query: INewFreeProxies
    ): Promise<IFreeproxy[]> {
        const freeproxies = await this.commander.getNewProjectFreeproxies(
            projectId,
            connectorId,
            query.count,
            query.excludeKeys
        );

        return freeproxies;
    }

    @Get('freeproxies/refresh')
    async getNextFreeproxiesToRefresh(): Promise<IFreeproxiesToRefresh> {
        const freeproxies = await this.commander.getNextFreeproxiesToRefresh();

        return freeproxies;
    }

    @Post('projects/:projectId/connectors/:connectorId/freeproxies')
    @HttpCode(204)
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

    @Post('freeproxies/refresh')
    @HttpCode(204)
    async updateFreeproxies(@Body() remoteFreeproxies: IFreeproxyRefreshed[]): Promise<void> {
        await this.commander.updateFreeproxies(remoteFreeproxies);
    }

    @Get('sources/refresh')
    async getNextSourceToRefresh(): Promise<ISource> {
        const source = await this.commander.getNextSourceToRefresh();

        return source;
    }

    @Post('sources/refresh')
    async updateSource(@Body() source: ISourceRefreshed): Promise<void> {
        await this.commander.updateSource(source);
    }

    //////////// TASKS ////////////
    @Put('projects/:projectId/tasks/:taskId')
    async updateTask(
        @Param('projectId') projectId: string,
            @Param('taskId') taskId: string,
            @Body() taskToUpdate: ITaskToUpdate
    ): Promise<ITaskView> {
        const task = await this.commander.updateTask(
            projectId,
            taskId,
            taskToUpdate
        );

        return task;
    }

    @Post('projects/:projectId/tasks/:taskId/lock')
    async lockTask(
        @Param('projectId') projectId: string,
            @Param('taskId') taskId: string
    ): Promise<void> {
        await this.commander.lockTask(
            projectId,
            taskId
        );
    }

    @Get('tasks/refresh')
    async getNextTaskToRefresh(): Promise<ITaskData> {
        const task = await this.commander.getNextTaskToRefresh();

        return task;
    }
}
