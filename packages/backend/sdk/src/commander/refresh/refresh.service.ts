import {
    Inject,
    Injectable,
    Logger,
} from '@nestjs/common';
import {
    addRange,
    EProjectStatus,
    EProxyStatus,
    fingerprintEquals,
    formatProxyId,
    fromProxySyncToData,
    generateUseragent,
    safeJoin,
    sleep,
} from '@scrapoxy/common';
import { deepEqual } from 'fast-equals';
import { COMMANDER_REFRESH_MODULE_CONFIG } from './refresh.constants';
import { schemaTaskToUpdate } from './refresh.validation';
import { ConnectorprovidersService } from '../../connectors';
import {
    NoFreeproxyToRefreshError,
    NoProxyToRefreshError,
} from '../../errors';
import { validate } from '../../helpers';
import { StorageprovidersService } from '../../storages';
import { TasksService } from '../../tasks';
import type { ICommanderRefreshModuleConfig } from './refresh.module';
import type { OnModuleDestroy } from '@nestjs/common';
import type {
    IConnectorProxyRefreshed,
    IConnectorToRefresh,
    ICreateRemoveLocalProxies,
    IFreeproxiesToRefresh,
    IFreeproxy,
    IFreeproxyRefreshed,
    IProjectMetricsAdd,
    IProjectMetricsAddView,
    IProxiesToRefresh,
    IProxyData,
    IProxyMetricsAdd,
    IProxyRefreshed,
    IProxySync,
    IRangeMetrics,
    ISynchronizeFreeproxies,
    ISynchronizeLocalProxiesData,
    ISynchronizeRemoteProxies,
    ITaskData,
    ITaskToUpdate,
    IWindowAdd,
} from '@scrapoxy/common';


@Injectable()
export class CommanderRefreshService implements OnModuleDestroy {
    protected readonly logger = new Logger(CommanderRefreshService.name);

    private stopping = false;

    constructor(
        private readonly connectorproviders: ConnectorprovidersService,
        @Inject(COMMANDER_REFRESH_MODULE_CONFIG)
        private readonly config: ICommanderRefreshModuleConfig,
        private readonly storageproviders: StorageprovidersService,
        private readonly tasks: TasksService
    ) {
    }

    async onModuleDestroy() {
        if (!this.config.clearAtShutdown) {
            return;
        }

        await this.stop();
    }

    //////////// PROJECTS ////////////
    async refreshProjectMetrics(): Promise<void> {
        this.logger.debug('refreshProjectMetrics()');

        const projects = await this.storageproviders.storage.getAllProjectsMetrics();

        if (projects.length <= 0) {
            return;
        }

        const projectsAdd = projects.map((project) => {
            const windowsAdd = project.windows.map((window) => {
                const add: IWindowAdd = {
                    id: window.id,
                    projectId: window.projectId,
                    size: window.size,
                    count: 1,
                    requests: project.project.snapshot.requests,
                    stops: project.project.snapshot.stops,
                    bytesReceived: project.project.snapshot.bytesReceived,
                    bytesSent: project.project.snapshot.bytesSent,
                    snapshot: null,
                };

                if (window.count >= window.delay) {
                    add.count -= window.count;
                    add.requests -= window.requests;
                    add.stops -= window.stops;
                    add.bytesReceived -= window.bytesReceived;
                    add.bytesSent -= window.bytesSent;
                    add.snapshot = {
                        requests: window.requests,
                        stops: window.stops,
                        bytesReceived: window.bytesReceived,
                        bytesSent: window.bytesSent,
                    };
                }

                return add;
            });
            const view: IProjectMetricsAddView = {
                project: {
                    id: project.project.id,
                    requests: project.project.snapshot.requests,
                    stops: project.project.snapshot.stops,
                    bytesReceived: project.project.snapshot.bytesReceived,
                    bytesSent: project.project.snapshot.bytesSent,
                    snapshot: {
                        requests: -project.project.snapshot.requests,
                        stops: -project.project.snapshot.stops,
                        bytesReceived: -project.project.snapshot.bytesReceived,
                        bytesSent: -project.project.snapshot.bytesSent,
                    },

                },
                windows: windowsAdd,
            };

            return view;
        });

        return this.storageproviders.storage.addProjectsMetrics(projectsAdd);
    }

    //////////// CONNECTORS ////////////
    async setConnectorError(
        projectId: string, connectorId: string, error: string | null
    ): Promise<void> {
        this.logger.debug(`setConnectorError(): projectId=${projectId} / connectorId=${connectorId} / error=${error}`);

        const connector = await this.storageproviders.storage.getConnectorById(
            projectId,
            connectorId
        );

        connector.error = error;

        await this.storageproviders.storage.updateConnector(connector);
    }

    async getNextConnectorToRefresh(): Promise<IConnectorToRefresh> {
        this.logger.debug('getNextConnectorToRefresh()');

        const nowTime = Date.now();
        const connector = await this.storageproviders.storage.getNextConnectorToRefresh(nowTime);
        const refreshDelay = this.connectorproviders.getFactory(connector.type).config.refreshDelay;

        await this.storageproviders.storage.updateConnectorNextRefreshTs(
            connector.projectId,
            connector.id,
            nowTime + refreshDelay
        );

        this.logger.debug(`getNextConnectorToRefresh: connector ${connector.id} will be refreshed`);

        return connector;
    }

    //////////// PROXIES ////////////
    async createAndRemoveConnectorProxies(
        projectId: string,
        connectorId: string,
        proxies: ICreateRemoveLocalProxies
    ): Promise<void> {
        this.logger.debug(`createAndRemoveConnectorProxies(): projectId=${projectId} / connectorId=${connectorId} / proxies.created.length=${proxies.created.length} / proxies.removed.length=${proxies.keysRemoved.length}`);

        const nowTime = Date.now();
        const localProxies = await this.storageproviders.storage.getAllConnectorProxiesSyncById(
            projectId,
            connectorId
        );
        const localProxiesMap = new Map<string, IProxySync>();
        for (const localProxy of localProxies.proxies) {
            localProxiesMap.set(
                localProxy.key,
                localProxy
            );
        }

        // Proxies creation
        const localProxiesCreatedMap = new Map<string, IProxySync>();
        for (const remoteProxy of proxies.created) {
            if (localProxiesMap.has(remoteProxy.key)) {
                continue;
            }

            const localProxy: IProxySync = {
                id: formatProxyId(
                    connectorId,
                    remoteProxy.key
                ),
                connectorId: connectorId,
                projectId,
                type: remoteProxy.type,
                key: remoteProxy.key,
                name: remoteProxy.name,
                config: remoteProxy.config,
                status: remoteProxy.status,
                createdTs: nowTime,
                useragent: generateUseragent(),
                timeoutDisconnected: localProxies.connector.proxiesTimeoutDisconnected,
                fingerprint: null,
                fingerprintError: null,
                removing: false,
                removingForce: false,
                disconnectedTs: nowTime,
                autoRotateDelayFactor: Math.random(),
                requests: 0,
            };
            localProxiesCreatedMap.set(
                localProxy.key,
                localProxy
            );
        }

        // Proxies removal
        const requestsBeforeStop: IRangeMetrics = {
            sum: 0,
            count: 0,
        };
        const uptimeBeforeStop: IRangeMetrics = {
            sum: 0,
            count: 0,
        };
        const localProxiesRemovedMap = new Map<string, IProxySync>();
        for (const key of proxies.keysRemoved) {
            const localProxyRemoved = localProxiesMap.get(key);

            if (!localProxyRemoved) {
                continue;
            }

            addRange(
                requestsBeforeStop,
                {
                    sum: localProxyRemoved.requests,
                    count: 1,
                    min: localProxyRemoved.requests,
                    max: localProxyRemoved.requests,
                }
            );

            const uptime = Math.floor((nowTime - localProxyRemoved.createdTs) / 1000);

            addRange(
                uptimeBeforeStop,
                {
                    sum: uptime,
                    count: 1,
                    min: uptime,
                    max: uptime,
                }
            );

            localProxiesRemovedMap.set(
                localProxyRemoved.key,
                localProxyRemoved
            );
        }

        // Calculate metrics
        let promiseMetrics: Promise<void>;

        if (localProxiesCreatedMap.size > 0 ||
            localProxiesRemovedMap.size > 0) {
            const projectMetricsAdd: IProjectMetricsAdd = {
                id: projectId,
            };

            if (localProxiesCreatedMap.size > 0) {
                projectMetricsAdd.proxiesCreated = localProxiesCreatedMap.size;
            }

            if (localProxiesRemovedMap.size > 0) {
                projectMetricsAdd.requestsBeforeStop = requestsBeforeStop;
                projectMetricsAdd.uptimeBeforeStop = uptimeBeforeStop;
                projectMetricsAdd.proxiesRemoved = localProxiesRemovedMap.size;
            }

            promiseMetrics = this.storageproviders.storage.addProjectsMetrics([
                {
                    project: projectMetricsAdd,
                },
            ]);
        } else {
            promiseMetrics = Promise.resolve();
        }

        // Write local data
        const actionsLocal: ISynchronizeLocalProxiesData = {
            created: Array.from(localProxiesCreatedMap.values())
                .map(fromProxySyncToData),
            updated: [],
            removed: Array.from(localProxiesRemovedMap.values()),
        };
        let promiseSync;

        if (actionsLocal.created.length > 0 ||
            actionsLocal.removed.length > 0) {
            if (actionsLocal.created.length > 0) {
                const keys = actionsLocal.created.map((p) => p.key);
                this.logger.debug(`createAndRemoveConnectorProxies: create ${
                    actionsLocal.created.length
                } local proxies: ${safeJoin(keys)}`);
            }

            if (actionsLocal.removed.length > 0) {
                const keys = actionsLocal.removed.map((p) => p.key);
                this.logger.debug(`createAndRemoveConnectorProxies: remove ${
                    actionsLocal.removed.length
                } local proxies: ${safeJoin(keys)}`);
            }

            promiseSync = this.storageproviders.storage.synchronizeProxies(actionsLocal);
        } else {
            promiseSync = Promise.resolve();
        }

        await Promise.all([
            promiseSync, promiseMetrics,
        ]);
    }

    async refreshConnectorProxies(
        projectId: string,
        connectorId: string,
        remoteProxies: IConnectorProxyRefreshed[]
    ): Promise<ISynchronizeRemoteProxies> {
        this.logger.debug(`refreshConnectorProxies(): projectId=${projectId} / connectorId=${connectorId} / remoteProxies.length=${remoteProxies.length}`);

        const nowTime = Date.now();
        // Part A: Get local data
        const promiseLocalProxies = this.storageproviders.storage.getAllConnectorProxiesSyncById(
            projectId,
            connectorId
        );
        const promiseProject = this.storageproviders.storage.getProjectSyncById(projectId);
        const [
            localProxies, project,
        ] = await Promise.all([
            promiseLocalProxies, promiseProject,
        ]);
        const
            localProxiesMap = new Map<string, IProxySync>(),
            localProxiesRemovedMap = new Map<string, IProxySync>();
        for (const localProxy of localProxies.proxies) {
            localProxiesMap.set(
                localProxy.key,
                localProxy
            );
            localProxiesRemovedMap.set(
                localProxy.key,
                localProxy
            );
        }

        // Part B: Prepare copy of remote data to local data
        const
            localProxiesCreatedMap = new Map<string, IProxySync>(),
            localProxiesUnmodifiedMap = new Map<string, IProxySync>(),
            localProxiesUpdatedMap = new Map<string, IProxySync>();
        for (const remoteProxy of remoteProxies) {
            let localProxy: IProxySync | undefined = localProxiesMap.get(remoteProxy.key);

            if (localProxy) {
                // Updated proxy
                if (localProxy.status !== remoteProxy.status ||
                    !deepEqual(
                        localProxy.config,
                        remoteProxy.config
                    )
                ) {
                    this.logger.debug(`refreshConnectorProxies: update local proxy ${localProxy.key} with remote data ${localProxy.status}`);

                    localProxy.status = remoteProxy.status;
                    localProxy.config = remoteProxy.config;

                    localProxiesUpdatedMap.set(
                        localProxy.key,
                        localProxy
                    );
                } else {
                    localProxiesUnmodifiedMap.set(
                        localProxy.key,
                        localProxy
                    );
                }

                localProxiesRemovedMap.delete(localProxy.key);
            } else {
                // Added proxy
                localProxy = {
                    id: formatProxyId(
                        connectorId,
                        remoteProxy.key
                    ),
                    connectorId: connectorId,
                    projectId,
                    type: remoteProxy.type,
                    key: remoteProxy.key,
                    name: remoteProxy.name,
                    config: remoteProxy.config,
                    status: remoteProxy.status,
                    createdTs: nowTime,
                    useragent: generateUseragent(),
                    timeoutDisconnected: localProxies.connector.proxiesTimeoutDisconnected,
                    fingerprint: null,
                    fingerprintError: null,
                    removing: false,
                    removingForce: false,
                    disconnectedTs: nowTime,
                    autoRotateDelayFactor: Math.random(),
                    requests: 0,
                };
                localProxiesMap.set(
                    localProxy.key,
                    localProxy
                );
                localProxiesCreatedMap.set(
                    localProxy.key,
                    localProxy
                );
            }
        }

        // Exclude deleted proxies from valid proxies
        for (const key of localProxiesRemovedMap.keys()) {
            localProxiesMap.delete(key);
        }

        // Add metrics
        const requestsBeforeStop: IRangeMetrics = {
            sum: 0,
            count: 0,
        };
        const uptimeBeforeStop: IRangeMetrics = {
            sum: 0,
            count: 0,
        };

        for (const localProxyRemoved of localProxiesRemovedMap.values()) {
            addRange(
                requestsBeforeStop,
                {
                    sum: localProxyRemoved.requests,
                    count: 1,
                    min: localProxyRemoved.requests,
                    max: localProxyRemoved.requests,
                }
            );

            const uptime = Math.floor((nowTime - localProxyRemoved.createdTs) / 1000);

            addRange(
                uptimeBeforeStop,
                {
                    sum: uptime,
                    count: 1,
                    min: uptime,
                    max: uptime,
                }
            );
        }

        let promiseMetrics: Promise<void>;

        if (localProxiesCreatedMap.size > 0 ||
            localProxiesRemovedMap.size > 0) {
            const projectMetricsAdd: IProjectMetricsAdd = {
                id: projectId,
            };

            if (localProxiesCreatedMap.size > 0) {
                projectMetricsAdd.proxiesCreated = localProxiesCreatedMap.size;
            }

            if (localProxiesRemovedMap.size > 0) {
                projectMetricsAdd.requestsBeforeStop = requestsBeforeStop;
                projectMetricsAdd.uptimeBeforeStop = uptimeBeforeStop;
                projectMetricsAdd.proxiesRemoved = localProxiesRemovedMap.size;
            }

            promiseMetrics = this.storageproviders.storage.addProjectsMetrics([
                {
                    project: projectMetricsAdd,
                },
            ]);
        } else {
            promiseMetrics = Promise.resolve();
        }

        // Part C: Discard removing & invalid proxies
        const
            remoteProxiesToRemoveMap = new Map<string, IProxySync>(),
            remoteProxiesToStartMap = new Map<string, IProxySync>();
        for (const localProxy of localProxiesMap.values()) {
            if (localProxy.removing) {
                remoteProxiesToRemoveMap.set(
                    localProxy.key,
                    localProxy
                );
            } else {
                switch (localProxy.status) {
                    case EProxyStatus.ERROR: {
                        this.logger.debug(`refreshConnectorProxies: ask to remove proxy ${localProxy.key} with error status`);
                        localProxy.removing = true;
                        break;
                    }

                    case EProxyStatus.STOPPED: {
                        remoteProxiesToStartMap.set(
                            localProxy.key,
                            localProxy
                        );
                        break;
                    }

                    default: {
                        if (localProxy.disconnectedTs && nowTime - localProxy.disconnectedTs > this.config.proxyUnreachableDelay) {
                            this.logger.debug(`refreshConnectorProxies: ask to remove proxy ${localProxy.key} disconnected for too long`);
                            localProxy.removing = true;
                        } else if (
                            project.autoRotate &&
                            project.status === EProjectStatus.HOT &&
                            nowTime - localProxy.createdTs >
                            project.autoRotateDelayRange.min + (project.autoRotateDelayRange.max - project.autoRotateDelayRange.min) * localProxy.autoRotateDelayFactor
                        ) {
                            this.logger.debug(`refreshConnectorProxies: ask to remove proxy ${localProxy.key} because auto rotate discards it`);
                            localProxy.removing = true;
                        }

                        break;
                    }
                }

                if (localProxy.removing) {
                    if (localProxiesUnmodifiedMap.has(localProxy.key)) {
                        localProxiesUnmodifiedMap.delete(localProxy.key);
                        localProxiesUpdatedMap.set(
                            localProxy.key,
                            localProxy
                        );
                    }
                }
            }
        }

        // Exclude removing proxies
        for (const key of remoteProxiesToRemoveMap.keys()) {
            localProxiesMap.delete(key);
        }

        // Part D: Scale down project if no data has been received for a long time
        if (project.autoScaleDown &&
            project.status === EProjectStatus.HOT &&
            nowTime - project.lastDataTs > project.autoScaleDownDelay) {

            project.status = EProjectStatus.CALM;

            const projectFound = await this.storageproviders.storage.getProjectById(projectId);

            projectFound.status = project.status;

            await this.storageproviders.storage.updateProject(projectFound);
        }

        // Part E: Calculate the scaling count
        let newSize: number;

        if (!localProxies.connector.active || this.stopping) {
            newSize = 0;
        } else {
            switch (project.status) {
                default: {
                    //case EProjectStatus.OFF: {
                    newSize = 0;

                    break;
                }

                case EProjectStatus.CALM: {
                    // Get count of online proxies
                    if (project.connectorDefaultId) {
                        if (localProxies.connector.id === project.connectorDefaultId) {
                            newSize = Math.min(
                                project.proxiesMin,
                                localProxies.connector.proxiesMax
                            );
                        } else {
                            newSize = 0;
                        }
                    } else {
                        newSize = 0;
                    }

                    break;
                }

                case EProjectStatus.HOT: {
                    newSize = localProxies.connector.proxiesMax;

                    break;
                }
            }
        }

        let remoteProxiesToCreateCount: number;

        if (localProxiesMap.size < newSize) {
            remoteProxiesToCreateCount = newSize - localProxiesMap.size;
        } else {
            remoteProxiesToCreateCount = 0;

            if (localProxiesMap.size > newSize) {
                while (localProxiesMap.size > newSize) {
                    const keys = Array.from(localProxiesMap.keys());
                    const ind = Math.floor(Math.random() * keys.length);
                    const key = keys[ ind ];
                    const localProxy = localProxiesMap.get(key);

                    if (localProxy) {
                        this.logger.debug(`refreshConnectorProxies: ask to remove proxy ${localProxy.key} because of scale down`);
                        localProxy.removing = true;

                        // Proxies are neither in unmodified map nor in created map
                        if (localProxiesUnmodifiedMap.has(localProxy.key)) {
                            localProxiesUnmodifiedMap.delete(localProxy.key);
                            localProxiesUpdatedMap.set(
                                localProxy.key,
                                localProxy
                            );
                        }

                        localProxiesMap.delete(localProxy.key);
                    }
                }
            }
        }

        // Part F: Write local data
        const actionsLocal: ISynchronizeLocalProxiesData = {
            created: Array.from(localProxiesCreatedMap.values())
                .map(fromProxySyncToData),
            updated: Array.from(localProxiesUpdatedMap.values())
                .map(fromProxySyncToData),
            removed: Array.from(localProxiesRemovedMap.values()),
        };
        let promiseSync;

        if (actionsLocal.created.length > 0 ||
            actionsLocal.updated.length > 0 ||
            actionsLocal.removed.length > 0) {
            if (actionsLocal.created.length > 0) {
                const keys = actionsLocal.created.map((p) => p.key);
                this.logger.debug(`refreshConnectorProxies: create ${
                    actionsLocal.created.length
                } local proxies: ${safeJoin(keys)}`);
            }

            if (actionsLocal.updated.length > 0) {
                const keys = actionsLocal.updated.map((p) => p.key);
                this.logger.debug(`refreshConnectorProxies: update ${
                    actionsLocal.updated.length
                } local proxies: ${safeJoin(keys)}`);
            }

            if (actionsLocal.removed.length > 0) {
                const keys = actionsLocal.removed.map((p) => p.key);
                this.logger.debug(`refreshConnectorProxies: remove ${
                    actionsLocal.removed.length
                } local proxies: ${safeJoin(keys)}`);
            }

            promiseSync = this.storageproviders.storage.synchronizeProxies(actionsLocal);
        } else {
            promiseSync = Promise.resolve();
        }

        await Promise.all([
            promiseSync, promiseMetrics,
        ]);

        // Part F: Send orders
        const orders: ISynchronizeRemoteProxies = {
            proxiesToCreateCount: remoteProxiesToCreateCount,
            keysToStart: Array.from(remoteProxiesToStartMap.values())
                .map((p) => p.key),
            keysToRemove: Array.from(remoteProxiesToRemoveMap.values())
                .map((p) => ({
                    key: p.key,
                    force: p.removingForce,
                })),
        };

        if (orders.proxiesToCreateCount > 0) {
            this.logger.debug(`refreshConnectorProxies: ask to create ${orders.proxiesToCreateCount} remote proxies`);
        }

        if (orders.keysToStart.length > 0) {
            this.logger.debug(`refreshConnectorProxies: ask to start ${
                orders.keysToStart.length
            } remote proxies: ${safeJoin(orders.keysToStart)}`);
        }

        if (orders.keysToRemove.length > 0) {
            const keys = orders.keysToRemove.map((p) => p.key);
            this.logger.debug(`refreshConnectorProxies: ask to remove ${
                orders.keysToRemove.length
            } remote proxies: ${safeJoin(keys)}`);
        }

        return orders;
    }

    async refreshProxies(remoteProxies: IProxyRefreshed[]): Promise<void> {
        this.logger.debug(`refreshProxies(): remoteProxies.length=${remoteProxies.length}`);

        if (remoteProxies.length <= 0) {
            return;
        }

        const remoteProxiesMap = new Map<string, IProxyRefreshed>();
        for (const remoteProxy of remoteProxies) {
            remoteProxiesMap.set(
                remoteProxy.id,
                remoteProxy
            );
        }

        const localProxies = await this.storageproviders.storage.getProxiesByIds(Array.from(remoteProxiesMap.keys()));
        const nowTime = Date.now();
        const localProxiesUpdated: IProxyData[] = [];
        for (const localProxy of localProxies) {
            const remoteProxy = remoteProxiesMap.get(localProxy.id);

            if (remoteProxy) {
                if (
                    !fingerprintEquals(
                        localProxy.fingerprint,
                        remoteProxy.fingerprint
                    ) ||
                    localProxy.fingerprintError !== remoteProxy.fingerprintError
                ) {
                    localProxy.fingerprint = remoteProxy.fingerprint;
                    localProxy.fingerprintError = remoteProxy.fingerprintError;

                    if (localProxy.fingerprint) {
                        this.logger.debug(`refreshProxies: update local proxy fingerprint ${localProxy.key} with ip ${localProxy.fingerprint.ip}`);
                        localProxy.disconnectedTs = null;
                    } else {
                        this.logger.debug(`refreshProxies: update local proxy empty fingerprint ${localProxy.key}`);

                        if (!localProxy.disconnectedTs ||
                            localProxy.disconnectedTs < 0) {
                            localProxy.disconnectedTs = nowTime;
                        }
                    }

                    const proxyUpdated: IProxyData = {
                        id: localProxy.id,
                        connectorId: localProxy.connectorId,
                        projectId: localProxy.projectId,
                        type: localProxy.type,
                        key: localProxy.key,
                        name: localProxy.name,
                        config: localProxy.config,
                        status: localProxy.status,
                        removing: localProxy.removing,
                        removingForce: localProxy.removingForce,
                        fingerprint: localProxy.fingerprint,
                        fingerprintError: localProxy.fingerprintError,
                        createdTs: localProxy.createdTs,
                        useragent: localProxy.useragent,
                        timeoutDisconnected: localProxy.timeoutDisconnected,
                        disconnectedTs: localProxy.disconnectedTs,
                        autoRotateDelayFactor: localProxy.autoRotateDelayFactor,
                    };

                    localProxiesUpdated.push(proxyUpdated);
                }
            }
        }

        if (localProxiesUpdated.length > 0) {
            await this.storageproviders.storage.synchronizeProxies({
                created: [],
                updated: localProxiesUpdated,
                removed: [],
            });
        }
    }

    async addProxiesMetrics(proxies: IProxyMetricsAdd[]): Promise<void> {
        this.logger.debug(`addProxiesMetrics(): proxies.length=${proxies.length}`);

        if (proxies.length <= 0) {
            return;
        }

        await this.storageproviders.storage.addProxiesMetrics(proxies);
    }

    async getNextProxiesToRefresh(): Promise<IProxiesToRefresh> {
        this.logger.debug('getNextProxiesToRefresh()');

        if (this.config.proxyRefresh.count <= 0) {
            throw new NoProxyToRefreshError();
        }

        const nowTime = Date.now();
        const proxies = await this.storageproviders.storage.getNextProxiesToRefresh(
            nowTime,
            this.config.proxyRefresh.count
        );
        const ids = proxies.map((p) => p.id);
        const [
            installId,
        ] = await Promise.all([
            this.storageproviders.storage.getParam('installId'),
            this.storageproviders.storage.updateProxiesNextRefreshTs(
                ids,
                nowTime + this.config.proxyRefresh.delay
            ),
        ]);
        const proxiesToRefresh: IProxiesToRefresh = {
            installId,
            proxies,
        };

        return proxiesToRefresh;
    }

    //////////// FREE PROXIES ////////////
    async getSelectedProjectFreeproxies(
        projectId: string,
        connectorId: string,
        keys: string[]
    ): Promise<IFreeproxy[]> {
        this.logger.debug(`getSelectedProjectFreeproxies(): projectId=${projectId} / connectorId=${connectorId} / keys=${safeJoin(keys)}`);

        if (keys.length <= 0) {
            return [];
        }

        const freeproxies = await this.storageproviders.storage.getSelectedProjectFreeproxies(
            projectId,
            connectorId,
            keys
        );

        return freeproxies;
    }

    async getNewProjectFreeproxies(
        projectId: string,
        connectorId: string,
        count: number,
        excludeKeys: string[]
    ): Promise<IFreeproxy[]> {
        this.logger.debug(`getNewProjectFreeproxies(): projectId=${projectId} / connectorId=${connectorId} / count=${count} / excludeKeys=${safeJoin(excludeKeys)}`);

        const freeproxies = await this.storageproviders.storage.getNewProjectFreeproxies(
            projectId,
            connectorId,
            count,
            excludeKeys
        );

        return freeproxies;
    }

    async getNextFreeproxiesToRefresh(): Promise<IFreeproxiesToRefresh> {
        this.logger.debug('getNextFreeproxiesToRefresh()');

        if (this.config.freeproxyRefresh.count <= 0) {
            throw new NoFreeproxyToRefreshError();
        }

        const nowTime = Date.now();
        const freeproxies = await this.storageproviders.storage.getNextFreeproxiesToRefresh(
            nowTime,
            this.config.freeproxyRefresh.count
        );

        if (freeproxies.length <= 0) {
            throw new NoFreeproxyToRefreshError();
        }

        const ids = freeproxies.map((p) => p.id);
        const [
            installId,
        ] = await Promise.all([
            this.storageproviders.storage.getParam('installId'),
            this.storageproviders.storage.updateFreeproxiesNextRefreshTs(
                ids,
                nowTime + this.config.freeproxyRefresh.delay
            ),
        ]);
        const freeproxiesToRefresh: IFreeproxiesToRefresh = {
            installId,
            freeproxies,
        };

        return freeproxiesToRefresh;
    }

    async updateFreeproxies(remoteFreeproxies: IFreeproxyRefreshed[]): Promise<void> {
        this.logger.debug(`updateFreeproxies(): remoteFreeproxies.length=${remoteFreeproxies.length}`);

        if (remoteFreeproxies.length <= 0) {
            return;
        }

        const remoteFreeproxiesMap = new Map<string, IFreeproxyRefreshed>();
        for (const remoteFreeproxy of remoteFreeproxies) {
            remoteFreeproxiesMap.set(
                remoteFreeproxy.id,
                remoteFreeproxy
            );
        }

        const localFreeproxies = await this.storageproviders.storage.getFreeproxiesByIds(Array.from(remoteFreeproxiesMap.keys()));
        const nowTime = Date.now();
        const actions: ISynchronizeFreeproxies = {
            updated: [],
            removed: [],
        };
        for (const localFreeproxy of localFreeproxies) {
            const remoteFreeproxy = remoteFreeproxiesMap.get(localFreeproxy.id);

            if (remoteFreeproxy) {
                let toUpdate: boolean;

                if (
                    !fingerprintEquals(
                        localFreeproxy.fingerprint,
                        remoteFreeproxy.fingerprint
                    ) ||
                    localFreeproxy.fingerprintError !== remoteFreeproxy.fingerprintError
                ) {
                    localFreeproxy.fingerprint = remoteFreeproxy.fingerprint;
                    localFreeproxy.fingerprintError = remoteFreeproxy.fingerprintError;

                    if (localFreeproxy.fingerprint) {
                        localFreeproxy.disconnectedTs = null;
                    } else {
                        if (!localFreeproxy.disconnectedTs ||
                            localFreeproxy.disconnectedTs < 0) {
                            localFreeproxy.disconnectedTs = nowTime;
                        }
                    }

                    toUpdate = true;
                } else {
                    toUpdate = false;
                }

                if (localFreeproxy.disconnectedTs && nowTime - localFreeproxy.disconnectedTs > this.config.proxyUnreachableDelay) {
                    actions.removed.push(localFreeproxy);
                } else if (toUpdate) {
                    actions.updated.push(localFreeproxy);
                }
            }
        }

        if (actions.updated.length > 0 ||
            actions.removed.length > 0) {
            await this.storageproviders.storage.synchronizeFreeproxies(actions);
        }
    }

    //////////// TASKS ////////////
    async updateTask(
        projectId: string, taskId: string, taskToUpdate: ITaskToUpdate
    ): Promise<ITaskData> {
        this.logger.debug(`updateTask(): projectId=${projectId} / taskId=${taskId}`);

        await validate(
            schemaTaskToUpdate,
            taskToUpdate
        );

        const task = await this.storageproviders.storage.getTaskById(
            projectId,
            taskId
        );
        const factory = this.tasks.getFactory(task.type);
        await factory.validate(taskToUpdate.data);

        Object.assign(
            task,
            taskToUpdate
        );

        if (!task.running) {
            task.endAtTs = Date.now();
        }

        await this.storageproviders.storage.updateTask(task);

        return task;
    }

    async lockTask(
        projectId: string, taskId: string
    ): Promise<void> {
        this.logger.debug(`lockTask(): projectId=${projectId} / taskId=${taskId}`);

        await this.storageproviders.storage.lockTask(
            projectId,
            taskId
        );
    }

    async getNextTaskToRefresh(): Promise<ITaskData> {
        this.logger.debug('getNextTaskToRefresh()');

        const nowTime = Date.now();
        const task = await this.storageproviders.storage.getNextTaskToRefresh(nowTime);

        this.logger.debug(`getNextTaskToRefresh: task ${task.id} will be refreshed`);

        return task;
    }

    //////////// MISC ////////////
    private async stop() {
        this.logger.log('Stopping proxies...');

        this.stopping = true;

        let count = await this.storageproviders.storage.getProxiesCount();
        this.logger.log(`Remaining ${count} proxies`);
        while (count > 0) {
            await sleep(this.config.stoppingDelay);

            count = await this.storageproviders.storage.getProxiesCount();
            this.logger.log(`Remaining ${count} proxies`);
        }

        this.logger.log('Proxies stopped.');
    }
}
