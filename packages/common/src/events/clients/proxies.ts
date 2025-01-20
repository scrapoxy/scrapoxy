import { Subscription } from 'rxjs';
import { ONE_SECOND_IN_MS } from '../../helpers';
import { isProxyOnline } from '../../proxies';
import { AEventsService } from '../events.abstract';
import {
    ConnectorCreatedEvent,
    ConnectorRemovedEvent,
    ConnectorUpdatedEvent,
    EEventScope,
    ProxiesMetricsAddedEvent,
    ProxiesSynchronizedEvent,
} from '../events.interface';
import type { IConnectorView } from '../../connectors';
import type {
    IConnectorProxiesView,
    IProxyBase,
    IProxyMetricsAdd,
    IProxyViewUI,
    ISynchronizeLocalProxiesBase,
} from '../../proxies';


export class EventsProxiesClient {
    readonly proxies: IProxyViewUI[] = [];

    private readonly connectorsNameMap = new Map<string, string>();

    private nowTime = Date.now();

    private nowTimeout: ReturnType<typeof setTimeout> | undefined;

    private projectId: string | undefined = void 0;

    private readonly proxiesMap = new Map<string, IProxyViewUI>();

    private readonly subscription = new Subscription();

    constructor(
        private readonly events: AEventsService,
        private readonly onProxiesRefreshed?: (proxies: ISynchronizeLocalProxiesBase) => void
    ) {}

    subscribe(
        projectId: string,
        views: IConnectorProxiesView[]
    ) {
        this.subscribeImpl(
            projectId,
            views
        );

        this.events.register({
            scope: EEventScope.PROXIES,
            projectId,
        });
    }

    async subscribeAsync(
        projectId: string,
        views: IConnectorProxiesView[]
    ): Promise<void> {
        this.subscribeImpl(
            projectId,
            views
        );

        await this.events.registerAsync({
            scope: EEventScope.PROXIES,
            projectId,
        });
    }

    unsubscribe() {
        if (this.projectId) {
            this.events.unregister({
                scope: EEventScope.PROXIES,
                projectId: this.projectId,
            });
        }

        this.unsubscribeImpl();
    }

    async unsubscribeAsync(): Promise<void> {


        if (this.projectId) {
            await this.events.unregisterAsync({
                scope: EEventScope.PROXIES,
                projectId: this.projectId,
            });
        }

        this.unsubscribeImpl();
    }

    private subscribeImpl(
        projectId: string,
        views: IConnectorProxiesView[]
    ) {
        const nowUpdate = () => {
            this.nowTime = Date.now();

            if (this.nowTimeout) {
                clearTimeout(this.nowTimeout);
            }

            for (const proxy of this.proxies) {
                proxy.elapsed = Math.max(
                    0,
                    Math.floor((this.nowTime - proxy.createdTs) / 1000)
                );
            }

            this.nowTimeout = setTimeout(
                () => {
                    nowUpdate();
                },
                10 * ONE_SECOND_IN_MS
            );
        };

        this.subscription.add(this.events.event$.subscribe((event) => {
            if (!event) {
                return;
            }

            switch (event.id) {
                case ConnectorCreatedEvent.id: {
                    const created = event as ConnectorCreatedEvent;
                    this.onConnectorCreated(created.connector);
                    break;
                }

                case ConnectorUpdatedEvent.id: {
                    const updated = event as ConnectorUpdatedEvent;
                    this.onConnectorUpdated(updated.connector);
                    break;
                }

                case ConnectorRemovedEvent.id: {
                    const removed = event as ConnectorRemovedEvent;
                    this.onConnectorRemoved(removed.connector);
                    break;
                }

                case ProxiesSynchronizedEvent.id: {
                    const synced = event as ProxiesSynchronizedEvent;
                    this.onProxiesSynchronized(synced.actions);
                    break;
                }

                case ProxiesMetricsAddedEvent.id: {
                    const added = event as ProxiesMetricsAddedEvent;
                    this.onProxiesMetricsAdded(added.proxies);
                    nowUpdate();
                    break;
                }
            }
        }));

        this.projectId = projectId;
        this.connectorsNameMap.clear();
        this.proxies.length = 0;
        this.proxiesMap.clear();

        for (const view of views) {
            this.connectorsNameMap.set(
                view.connector.id,
                view.connector.name
            );

            for (const proxy of view.proxies) {
                const proxyCreated: IProxyViewUI = {
                    ...proxy,
                    connectorName: this.connectorsNameMap.get(proxy.connectorId) ?? '',
                    online: isProxyOnline(proxy),
                    elapsed: Math.max(
                        0,
                        Math.floor((this.nowTime - proxy.createdTs) / 1000)
                    ),
                    requests: proxy.requests,
                    bytesReceived: proxy.bytesReceived,
                    bytesSent: proxy.bytesSent,
                };

                this.proxies.push(proxyCreated);

                this.proxiesMap.set(
                    proxyCreated.id,
                    proxyCreated
                );
            }
        }

        this.sortProxies();

        nowUpdate();
    }

    private unsubscribeImpl() {
        this.subscription.unsubscribe();

        if (this.nowTimeout) {
            clearTimeout(this.nowTimeout);
            this.nowTimeout = void 0;
        }
    }

    private onConnectorCreated(connector: IConnectorView) {
        if (this.projectId !== connector.projectId) {
            return;
        }

        this.connectorsNameMap.set(
            connector.id,
            connector.name
        );
    }

    private onConnectorUpdated(connector: IConnectorView) {
        if (this.projectId !== connector.projectId) {
            return;
        }

        this.connectorsNameMap.set(
            connector.id,
            connector.name
        );
    }

    private onConnectorRemoved(connector: IConnectorView) {
        if (this.projectId !== connector.projectId) {
            return;
        }

        this.connectorsNameMap.delete(connector.id);
    }

    private onProxiesSynchronized(actions: ISynchronizeLocalProxiesBase) {
        // Add
        const oldSize = this.proxies.length;
        this.addProxiesBase(actions.created);

        if (oldSize !== this.proxies.length) {
            this.sortProxies();
        }

        // Update
        this.updateProxies(actions.updated);

        // Remove
        this.removeProxies(actions.removed);

        if (this.onProxiesRefreshed) {
            this.onProxiesRefreshed(actions);
        }
    }

    private addProxiesBase(proxies: IProxyBase[]) {
        for (const proxy of proxies) {
            if (this.projectId === proxy.projectId &&
                !this.proxiesMap.has(proxy.id)) {
                const proxyCreated: IProxyViewUI = {
                    ...proxy,
                    connectorName: this.connectorsNameMap.get(proxy.connectorId) ?? '',
                    online: isProxyOnline(proxy),
                    elapsed: Math.max(
                        0,
                        Math.floor((this.nowTime - proxy.createdTs) / 1000)
                    ),
                    requests: 0,
                    requestsValid: 0,
                    requestsInvalid: 0,
                    bytesReceived: 0,
                    bytesSent: 0,
                };

                this.proxies.push(proxyCreated);

                this.proxiesMap.set(
                    proxyCreated.id,
                    proxyCreated
                );
            }
        }
    }

    private updateProxies(proxies: IProxyBase[]) {
        for (const proxy of proxies) {
            const proxyFound = this.proxiesMap.get(proxy.id);

            if (proxyFound) {
                proxyFound.status = proxy.status;
                proxyFound.removing = proxy.removing;
                proxyFound.removingForce = proxy.removingForce;
                proxyFound.removingForceCap = proxy.removingForceCap;
                proxyFound.fingerprint = proxy.fingerprint;
                proxyFound.fingerprintError = proxy.fingerprintError;
                proxyFound.online = isProxyOnline(proxy);
            }
        }
    }

    private removeProxies(proxies: IProxyBase[]) {
        for (const proxy of proxies) {
            const proxyFound = this.proxiesMap.get(proxy.id);

            if (proxyFound) {
                const index = this.proxies.findIndex((p) => p.id === proxy.id);
                this.proxies.splice(
                    index,
                    1
                );

                this.proxiesMap.delete(proxy.id);
            }
        }
    }

    private onProxiesMetricsAdded(proxies: IProxyMetricsAdd[]) {
        for (const proxy of proxies) {
            if (this.projectId === proxy.projectId) {
                const proxyFound = this.proxiesMap.get(proxy.id);

                if (proxyFound) {
                    proxyFound.requests += proxy.requests;
                    proxyFound.requestsValid += proxy.requestsValid;
                    proxyFound.requestsInvalid += proxy.requestsInvalid;
                    proxyFound.bytesReceived += proxy.bytesReceived;
                    proxyFound.bytesSent += proxy.bytesSent;
                }
            }
        }
    }

    private sortProxies() {
        this.proxies.sort((
            a, b
        ) => {
            const cmp = a.connectorName.localeCompare(b.connectorName);

            if (cmp !== 0) {
                return cmp;
            }

            return a.key.localeCompare(b.key);
        });
    }
}
