import {
    Body,
    Controller,
    Get,
    HttpCode,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import { CommanderScraperService } from './scraper.service';
import { CommanderScraperTokenGuard } from './token.guard';
import type { IRequestToken } from '../commander.interface';
import type {
    IConnectorProxiesView,
    IProjectStatus,
    IProjectView,
    IProxyIdToRemove,
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
}
