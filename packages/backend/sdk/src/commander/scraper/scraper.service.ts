import {
    Injectable,
    Logger,
} from '@nestjs/common';
import {
    EProjectStatus,
    safeJoin,
    toProjectView,
} from '@scrapoxy/common';
import { ProxiesNotFoundError } from '../../commander-client';
import { validate } from '../../helpers';
import { StorageprovidersService } from '../../storages';
import {
    schemaProjectStatusToSet,
    schemaProxiesToRemove,
} from '../commander.validation';
import type {
    IConnectorProxiesView,
    IProjectView,
    IProxyIdToRemove,
} from '@scrapoxy/common';


@Injectable()
export class CommanderScraperService {
    protected readonly logger = new Logger(CommanderScraperService.name);

    constructor(private readonly storageproviders: StorageprovidersService) {}

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

        if (project.status === status) {
            return;
        }

        project.status = status;

        const promises: Promise<void>[] = [
            this.storageproviders.storage.updateProject(project),
        ];

        if (status === EProjectStatus.HOT) {
            promises.push(this.storageproviders.storage.updateProjectLastDataTs(
                project.id,
                Date.now()
            ));
        }

        await Promise.all(promises);
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
        const ids = proxiesIds.map((p) => p.id);
        this.logger.debug(`askProxiesToRemove(): token=${token} / proxiesIds=${safeJoin(ids)}`);

        await validate(
            schemaProxiesToRemove,
            proxiesIds
        );

        if (proxiesIds.length <= 0) {
            return;
        }

        const forceMap = new Map<string, boolean>();
        for (const proxy of proxiesIds) {
            forceMap.set(
                proxy.id,
                proxy.force
            );
        }

        const projectId = await this.storageproviders.storage.getProjectIdByToken(token);
        const proxiesFound = await this.storageproviders.storage.getProjectProxiesByIds(
            projectId,
            ids,
            false
        );

        if (proxiesFound.length <= 0) {
            throw new ProxiesNotFoundError(ids);
        }

        for (const proxyFound of proxiesFound) {
            proxyFound.removing = true;
            proxyFound.removingForce = forceMap.get(proxyFound.id) ?? false;
        }

        await this.storageproviders.storage.synchronizeProxies({
            created: [],
            updated: proxiesFound,
            removed: [],
        });

        await this.storageproviders.storage.addProjectsMetrics([
            {
                project: {
                    id: projectId,
                    snapshot: {
                        requests: 0,
                        stops: proxiesFound.length,
                        bytesReceived: 0,
                        bytesSent: 0,
                    },
                },
            },
        ]);
    }
}
