import {
    Injectable,
    Logger,
} from '@nestjs/common';
import {
    EProjectStatus,
    toProjectView,
} from '@scrapoxy/common';
import { validate } from '../../helpers';
import { StorageprovidersService } from '../../storages';
import { ACommanderService } from '../commander.abstract';
import {
    schemaFreeproxiesToCreate,
    schemaFreeproxiesToRemove,
    schemaProjectStatusToSet,
    schemaProxiesToRemove,
    schemaSourcesToCreate,
    schemaSourcesToRemove,
} from '../commander.validation';
import type {
    IConnectorProxiesView,
    IFreeproxiesToRemoveOptions,
    IFreeproxy,
    IFreeproxyBase,
    IProjectView,
    IProxyIdToRemove,
    ISource,
    ISourceBase,
} from '@scrapoxy/common';


@Injectable()
export class CommanderScraperService extends ACommanderService {
    protected readonly logger = new Logger(CommanderScraperService.name);

    // eslint-disable-next-line @typescript-eslint/no-useless-constructor
    constructor(storageproviders: StorageprovidersService) {
        super(storageproviders);
    }

    //////////// PROJECTS ////////////
    async getProjectByToken(token: string): Promise<IProjectView> {
        this.logger.debug(`getProjectByToken(): token=${token}`);

        const project = await this.storageproviders.storage.getProjectByToken(token);

        return toProjectView(project);
    }

    async setProjectStatus(
        token: string, status: EProjectStatus
    ): Promise<void> {
        this.logger.debug(`setProjectStatus(): token=${token} / status=${status}`);

        await validate(
            schemaProjectStatusToSet,
            status
        );

        const project = await this.storageproviders.storage.getProjectByToken(token);

        await this.setProjectStatusImpl(
            project,
            status
        );
    }


    //////////// CONNECTORS ////////////
    async getAllProjectConnectorsAndProxiesByToken(token: string): Promise<IConnectorProxiesView[]> {
        this.logger.debug(`getAllProjectConnectorsAndProxiesByToken(): token=${token}`);

        const projectId = await this.storageproviders.storage.getProjectIdByToken(token);
        const connectors = await this.storageproviders.storage.getAllProjectConnectorsAndProxiesById(projectId);

        return connectors;
    }


    //////////// PROXIES ////////////
    async askProxiesToRemove(
        token: string,
        proxiesIds: IProxyIdToRemove[]
    ): Promise<void> {
        this.logger.debug(`askProxiesToRemove(): token=${token} / proxiesIds.length=${proxiesIds.length}`);

        await validate(
            schemaProxiesToRemove,
            proxiesIds
        );

        if (proxiesIds.length <= 0) {
            return;
        }

        const projectId = await this.storageproviders.storage.getProjectIdByToken(token);

        await super.askProxiesToRemoveImpl(
            projectId,
            proxiesIds
        );
    }

    //////////// FREE PROXIES ////////////
    async getAllProjectFreeproxiesById(
        token: string, connectorId: string
    ): Promise<IFreeproxy[]> {
        this.logger.debug(`getAllProjectFreeproxiesById(): token=${token} / connectorId=${connectorId}`);

        const projectId = await this.storageproviders.storage.getProjectIdByToken(token);
        const freeproxies = await this.storageproviders.storage.getAllProjectFreeproxiesById(
            projectId,
            connectorId
        );

        return freeproxies;
    }

    async createFreeproxies(
        token: string,
        connectorId: string, freeproxies: IFreeproxyBase[]
    ): Promise<void> {
        this.logger.debug(`createFreeproxies(): token=${token} / connectorId=${connectorId} / freeproxies.length=${freeproxies.length}`);

        await validate(
            schemaFreeproxiesToCreate,
            freeproxies
        );

        if (freeproxies.length <= 0) {
            return;
        }

        const projectId = await this.storageproviders.storage.getProjectIdByToken(token);

        await this.createFreeproxiesImpl(
            projectId,
            connectorId,
            freeproxies
        );
    }

    async removeFreeproxies(
        token: string,
        connectorId: string,
        options?: IFreeproxiesToRemoveOptions
    ): Promise<void> {
        this.logger.debug(`removeFreeproxies(): token=${token} / connectorId=${connectorId}`);

        await validate(
            schemaFreeproxiesToRemove,
            options
        );

        const projectId = await this.storageproviders.storage.getProjectIdByToken(token);

        await this.removeFreeproxiesImpl(
            projectId,
            connectorId,
            options
        );
    }

    async getAllProjectSourcesById(
        token: string, connectorId: string
    ): Promise<ISource[]> {
        this.logger.debug(`getAllProjectSourcesById(): token=${token} / connectorId=${connectorId}`);

        const projectId = await this.storageproviders.storage.getProjectIdByToken(token);
        const sources = await this.storageproviders.storage.getAllProjectSourcesById(
            projectId,
            connectorId
        );

        return sources;
    }

    async createSources(
        token: string,
        connectorId: string,
        sources: ISourceBase[]
    ): Promise<void> {
        this.logger.debug(`createSources(): token=${token} / connectorId=${connectorId} / sources.length=${sources.length}`);

        await validate(
            schemaSourcesToCreate,
            sources
        );

        const projectId = await this.storageproviders.storage.getProjectIdByToken(token);

        await this.createSourcesImpl(
            projectId,
            connectorId,
            sources
        );
    }

    async removeSources(
        token: string,
        connectorId: string,
        ids: string[]
    ): Promise<void> {
        this.logger.debug(`removeSources(): token=${token} / connectorId=${connectorId} / ids.length=${ids.length}`);

        await validate(
            schemaSourcesToRemove,
            ids
        );

        const projectId = await this.storageproviders.storage.getProjectIdByToken(token);

        await this.removeSourcesImpl(
            projectId,
            connectorId,
            ids
        );
    }
}
