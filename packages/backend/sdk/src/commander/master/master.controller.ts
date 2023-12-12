import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Query,
    Request,
    UseGuards,
} from '@nestjs/common';
import { CommanderMasterService } from './master.service';
import {
    CommanderMasterTokenGuard,
    CommanderProjectMasterTokenGuard,
} from './token.guard';
import type { IRequestToken } from '../commander.interface';
import type {
    IProjectToConnect,
    IProjectToConnectQuery,
    IProxyToConnect,
} from '@scrapoxy/common';


@Controller('api/master')
export class CommanderMasterController {
    constructor(private readonly commander: CommanderMasterService) {
    }

    //////////// PROJECT ////////////
    @Post('projects')
    @UseGuards(CommanderProjectMasterTokenGuard)
    async getProjectToConnect(
        @Request() req: IRequestToken,
            @Body() query: IProjectToConnectQuery
    ): Promise<IProjectToConnect> {
        const project = await this.commander.getProjectToConnect(
            req.token,
            query.mode,
            query.certificateHostname
        );

        return project;
    }

    @Post('projects/:projectId/scaleup')
    @UseGuards(CommanderMasterTokenGuard)
    async scaleUpProject(@Param('projectId') projectId: string): Promise<void> {
        await this.commander.scaleUpProject(projectId);
    }

    //////////// PROXIES ////////////
    @Get('projects/:projectId/proxy')
    @UseGuards(CommanderMasterTokenGuard)
    async getNextProxyToConnect(
        @Param('projectId') projectId: string,
            @Query('proxyname') proxyname?: string
    ): Promise<IProxyToConnect> {
        const proxy = await this.commander.getNextProxyToConnect(
            projectId,
            proxyname ?? null
        );

        return proxy;
    }
}
