import { createHash } from 'crypto';
import {
    CONNECTOR_FREEPROXIES_TYPE,
    EProjectStatus,
    formatFreeproxyId,
    toOptionalValue,
} from '@scrapoxy/common';
import { filterDuplicateOutboundIpFreeproxies } from './frontend/frontend.helpers';
import {
    ConnectorWrongTypeError,
    ProxiesNotFoundError,
} from '../errors';
import { StorageprovidersService } from '../storages';
import type { Logger } from '@nestjs/common';
import type {
    IConnectorFreeproxyConfig,
    IFreeproxiesToRemoveOptions,
    IFreeproxyBase,
    IProjectData,
    IProxyIdToRemove,
    ISource,
    ISourceBase,
} from '@scrapoxy/common';


export abstract class ACommanderService {
    protected abstract logger: Logger;

    protected constructor(protected readonly storageproviders: StorageprovidersService) {}

    //////////// PROJECTS ////////////
    protected async setProjectStatusImpl(
        project: IProjectData, status: EProjectStatus
    ): Promise<void> {
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

    //////////// PROXIES ////////////
    protected async askProxiesToRemoveImpl(
        projectId: string, proxiesIds: IProxyIdToRemove[]
    ): Promise<void> {
        const forceMap = new Map<string, boolean>();
        for (const proxy of proxiesIds) {
            forceMap.set(
                proxy.id,
                proxy.force
            );
        }

        const ids = proxiesIds.map((p) => p.id);
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

    //////////// FREE PROXIES ////////////
    protected async createFreeproxiesImpl(
        projectId: string,
        connectorId: string,
        freeproxies: IFreeproxyBase[]
    ): Promise<void> {
        const nowTime = Date.now();
        const connector = await this.storageproviders.storage.getConnectorById(
            projectId,
            connectorId
        );

        if (connector.type !== CONNECTOR_FREEPROXIES_TYPE) {
            throw new ConnectorWrongTypeError(
                CONNECTOR_FREEPROXIES_TYPE,
                connector.type
            );
        }

        const freeproxiesExisting = await this.storageproviders.storage.getAllProjectFreeproxiesById(
            projectId,
            connectorId
        );
        const freeproxiesIds = new Set(freeproxiesExisting.map((fp) => fp.id));
        const config = connector.config as IConnectorFreeproxyConfig;
        const timeoutUnreachable = toOptionalValue(config.freeproxiesTimeoutUnreachable);
        const freeproxiesToCreate = freeproxies.map((fp) => ({
            id: formatFreeproxyId(
                connectorId,
                fp
            ),
            projectId,
            connectorId: connectorId,
            key: fp.key,
            type: fp.type,
            address: fp.address,
            auth: fp.auth,
            timeoutDisconnected: config.freeproxiesTimeoutDisconnected,
            timeoutUnreachable,
            disconnectedTs: nowTime,
            fingerprint: null,
            fingerprintError: null,
        }))
            .filter((fp) => !freeproxiesIds.has(fp.id));

        if (freeproxiesToCreate.length <= 0) {
            return;
        }

        await this.storageproviders.storage.createFreeproxies(
            projectId,
            connectorId,
            freeproxiesToCreate
        );
    }

    protected async removeFreeproxiesImpl(
        projectId: string,
        connectorId: string,
        options?: IFreeproxiesToRemoveOptions
    ): Promise<void> {
        let freeproxies = await this.storageproviders.storage.getAllProjectFreeproxiesById(
            projectId,
            connectorId
        );

        if (options) {
            if (options.ids && options.ids.length > 0) {
                freeproxies = freeproxies.filter((fp) => options.ids!.includes(fp.id));
            }


            if (options.duplicate) {
                freeproxies = filterDuplicateOutboundIpFreeproxies(freeproxies);
            }

            if (options.onlyOffline) {
                freeproxies = freeproxies.filter((fp) => !fp.fingerprint);
            }
        }

        if (freeproxies.length <= 0) {
            return;
        }

        await this.storageproviders.storage.synchronizeFreeproxies({
            updated: [],
            removed: freeproxies,
        });
    }

    protected async createSourcesImpl(
        projectId: string,
        connectorId: string,
        sources: ISourceBase[]
    ): Promise<void> {
        const connector = await this.storageproviders.storage.getConnectorById(
            projectId,
            connectorId
        );

        if (connector.type !== CONNECTOR_FREEPROXIES_TYPE) {
            throw new ConnectorWrongTypeError(
                CONNECTOR_FREEPROXIES_TYPE,
                connector.type
            );
        }

        const sourcesExisting = await this.storageproviders.storage.getAllProjectSourcesById(
            projectId,
            connectorId
        );
        const sourcesUrls = new Set(sourcesExisting.map((s) => s.url));
        const create: ISource[] = sources
            .filter((source) => !sourcesUrls.has(source.url))
            .map((source) => {
                const hash = createHash('sha256')
                    .update(source.url)
                    .digest('hex');

                return {
                    ...source,
                    projectId,
                    connectorId,
                    id: `${connectorId}:${hash}`,
                    lastRefreshTs: null,
                    lastRefreshError: null,
                };
            });

        if (create.length <= 0) {
            return;
        }

        await this.storageproviders.storage.createSources(create);
    }

    protected async removeSourcesImpl(
        projectId: string,
        connectorId: string,
        ids: string[]
    ): Promise<void> {
        let sources = await this.storageproviders.storage.getAllProjectSourcesById(
            projectId,
            connectorId
        );

        if (ids && ids.length > 0) {
            sources = sources.filter((s) => ids!.includes(s.id));
        }

        if (sources.length <= 0) {
            return;
        }

        await this.storageproviders.storage.removeSources(sources);
    }
}
