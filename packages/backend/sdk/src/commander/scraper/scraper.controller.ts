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
import {
    ApiBasicAuth,
    ApiBody,
    ApiForbiddenResponse,
    ApiNoContentResponse,
    ApiOkResponse,
    ApiOperation,
} from '@nestjs/swagger';
import {
    CONNECTOR_PROXIES_VIEW_SWAGGER_PROPS,
    FREEPROXIES_TO_REMOVE_OPTIONS_SWAGGER_PROPS,
    FREEPROXY_BASE_SWAGGER_PROPS,
    FREEPROXY_SWAGGER_PROPS,
    PROJECT_STATUS_SWAGGER_PROPS,
    PROJECT_VIEW_SWAGGER_PROPS,
    PROXY_ID_TO_REMOVE_SWAGGER_PROPS,
    SOURCE_BASE_SWAGGER_PROPS,
    SOURCE_SWAGGER_PROPS,
} from '@scrapoxy/common';
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


@ApiBasicAuth()
@Controller('api/scraper')
@UseGuards(CommanderScraperTokenGuard)
export class CommanderScraperController {
    constructor(private readonly commander: CommanderScraperService) {}

    //////////// PROJECTS ////////////
    @Get('project')
    @ApiOperation({
        description: 'Get project information',
    })
    @ApiOkResponse({
        description: 'Project found',
        schema: {
            type: 'object',
            properties: PROJECT_VIEW_SWAGGER_PROPS,
        },
    })
    @ApiForbiddenResponse({
        description: 'Project not found or wrong credential',
    })
    async getProjectByToken(@Req() req: IRequestToken): Promise<IProjectView> {
        const project = await this.commander.getProjectByToken(req.token);

        return project;
    }

    @Post('project/status')
    @HttpCode(204)
    @ApiOperation({
        description: 'Change project\'s status',
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: PROJECT_STATUS_SWAGGER_PROPS,
        },
    })
    @ApiNoContentResponse({
        description: 'Project status updated',
    })
    @ApiForbiddenResponse({
        description: 'Project not found or wrong credential',
    })
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
    @ApiOperation({
        description: 'Get all connectors and proxies of the project',
    })
    @ApiOkResponse({
        description: 'Connectors and proxies found',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: CONNECTOR_PROXIES_VIEW_SWAGGER_PROPS,
            },
        },
    })
    @ApiForbiddenResponse({
        description: 'Project not found or wrong credential',
    })
    async getAllProjectConnectorsAndProxiesById(@Req() req: IRequestToken): Promise<IConnectorProxiesView[]> {
        const connectors = await this.commander.getAllProjectConnectorsAndProxiesByToken(req.token);

        return connectors;
    }

    //////////// PROXIES ////////////
    @Post('project/proxies/remove')
    @HttpCode(204)
    @ApiOperation({
        description: 'Ask to remove some proxies',
    })
    @ApiBody({
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: PROXY_ID_TO_REMOVE_SWAGGER_PROPS,
            },
        },
    })
    @ApiNoContentResponse({
        description: 'Proxies asked to be removed',
    })
    @ApiForbiddenResponse({
        description: 'Project not found or wrong credential',
    })
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
    @ApiOperation({
        description: 'Get all freeproxies of a connector',
    })
    @ApiForbiddenResponse({
        description: 'Project not found or wrong credential',
    })
    @ApiOkResponse({
        description: 'Freeproxies found',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: FREEPROXY_SWAGGER_PROPS,
            },
        },
    })
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
    @ApiOperation({
        description: 'Add multiple freeproxies for a connector',
    })
    @ApiBody({
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: FREEPROXY_BASE_SWAGGER_PROPS,
            },
        },
    })
    @ApiNoContentResponse({
        description: 'Freeproxies created',
    })
    @ApiForbiddenResponse({
        description: 'Project not found or wrong credential',
    })
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
    @ApiOperation({
        description: 'Remove multiple freeproxies for a connector',
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: FREEPROXIES_TO_REMOVE_OPTIONS_SWAGGER_PROPS,
        },
    })
    @ApiNoContentResponse({
        description: 'Freeproxies removed',
    })
    @ApiForbiddenResponse({
        description: 'Project not found or wrong credential',
    })
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
    @ApiOperation({
        description: 'Get all sources providing proxy lists sources for a connector',
    })
    @ApiOkResponse({
        description: 'Sources found',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: SOURCE_SWAGGER_PROPS,
            },
        },
    })
    @ApiForbiddenResponse({
        description: 'Project not found or wrong credential',
    })
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
    @ApiOperation({
        description: 'Add multiple sources providing proxy lists for a connector',
    })
    @HttpCode(204)
    @ApiBody({
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: SOURCE_BASE_SWAGGER_PROPS,
            },
        },
    })
    @ApiNoContentResponse({
        description: 'Sources created',
    })
    @ApiForbiddenResponse({
        description: 'Project not found or wrong credential',
    })
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
    @HttpCode(204)
    @ApiOperation({
        description: 'Remove multiple sources providing proxy lists for a connector',
    })
    @ApiBody({
        schema: {
            type: 'array',
            items: {
                type: 'string',
            },
        },
    })
    @ApiNoContentResponse({
        description: 'Sources removed',
    })
    @ApiForbiddenResponse({
        description: 'Project not found or wrong credential',
    })
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
