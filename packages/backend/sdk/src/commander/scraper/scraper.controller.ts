import {
    Body,
    Controller,
    Get,
    HttpCode,
    Param,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import { CommanderScraperService } from './scraper.service';
import { CommanderScraperTokenGuard } from './token.guard';
import type { IRequestToken } from '../commander.interface';
import type {
    IConnectorProxiesView,
    IFreeproxiesToRemoveOptions,
    IFreeproxy,
    IFreeproxyBase,
    IProjectStatus,
    IProjectView,
    IProxyIdToRemove,
    ISource,
    ISourceBase,
} from '@scrapoxy/common';


@Controller('api/scraper')
@UseGuards(CommanderScraperTokenGuard)
export class CommanderScraperController {
    constructor(private readonly commander: CommanderScraperService) {}

    //////////// PROJECTS ////////////
    @Get('project')
    async getProjectByToken(@Req() req: IRequestToken): Promise<IProjectView> {
        const project = await this.commander.getProjectByToken(req.token);

        return project;
    }

    @Post('project/status')
    @HttpCode(204)
    async setProjectStatus(
        @Req() req: IRequestToken,
            @Body() project: IProjectStatus
    ): Promise<void> {
        await this.commander.setProjectStatus(
            req.token,
            project.status
        );
    }

    //////////// CONNECTORS ////////////
    @Get('project/connectors')
    async getAllProjectConnectorsAndProxiesById(@Req() req: IRequestToken): Promise<IConnectorProxiesView[]> {
        const connectors = await this.commander.getAllProjectConnectorsAndProxiesByToken(req.token);

        return connectors;
    }

    //////////// PROXIES ////////////
    @Post('project/proxies/remove')
    @HttpCode(204)
    async askProxiesToRemove(
        @Req() req: IRequestToken,
            @Body() proxiesIds: IProxyIdToRemove[]
    ): Promise<void> {
        await this.commander.askProxiesToRemove(
            req.token,
            proxiesIds
        );
    }

    //////////// FREE PROXIES ////////////
    @Get('project/connectors/:connectorId/freeproxies')
    async getAllProjectFreeproxiesById(
        @Req() req: IRequestToken,
            @Param('connectorId') connectorId: string
    ): Promise<IFreeproxy[]> {
        const freeproxies = await this.commander.getAllProjectFreeproxiesById(
            req.token,
            connectorId
        );

        return freeproxies;
    }

    @Post('project/connectors/:connectorId/freeproxies')
    @HttpCode(204)
    async createFreeproxies(
        @Req() req: IRequestToken,
            @Param('connectorId') connectorId: string,
            @Body() freeproxies: IFreeproxyBase[]
    ): Promise<void> {
        await this.commander.createFreeproxies(
            req.token,
            connectorId,
            freeproxies
        );
    }

    @Post('project/connectors/:connectorId/freeproxies/remove')
    @HttpCode(204)
    async removeFreeproxies(
        @Req() req: IRequestToken,
            @Param('connectorId') connectorId: string,
            @Body() options?: IFreeproxiesToRemoveOptions
    ): Promise<void> {
        await this.commander.removeFreeproxies(
            req.token,
            connectorId,
            options
        );
    }

    @Get('project/connectors/:connectorId/sources')
    async getAllProjectSourcesById(
        @Req() req: IRequestToken,
            @Param('connectorId') connectorId: string
    ): Promise<ISource[]> {
        const sources = await this.commander.getAllProjectSourcesById(
            req.token,
            connectorId
        );

        return sources;
    }

    @Post('project/connectors/:connectorId/sources')
    async createSources(
        @Req() req: IRequestToken,
            @Param('connectorId') connectorId: string,
            @Body() sources: ISourceBase[]
    ): Promise<void> {
        await this.commander.createSources(
            req.token,
            connectorId,
            sources
        );
    }

    @Post('project/connectors/:connectorId/sources/remove')
    async removeSources(
        @Req() req: IRequestToken,
            @Param('connectorId') connectorId: string,
            @Body() ids: string[]
    ): Promise<void> {
        await this.commander.removeSources(
            req.token,
            connectorId,
            ids
        );
    }
}
