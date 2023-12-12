import { Subscription } from 'rxjs';
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
    IProxyView,
    ISynchronizeLocalProxiesBase,
} from '../../proxies';


export class EventsConnectorsClient {
    proxiesOnlineCount = 0;

    readonly views: IConnectorProxiesView[] = [];

    private projectId: string | undefined = void 0;

    private readonly proxiesMap = new Map<string, IProxyView>();

    private readonly subscription = new Subscription();

    private readonly viewsMap = new Map<string, IConnectorProxiesView>();

    constructor(private readonly events: AEventsService) {}

    // for tests only
    get proxies(): IProxyView[] {
        return Array.from(this.proxiesMap.values());
    }

    get proxiesCount() {
        return this.proxiesMap.size;
    }

    subscribe(
        projectId: string, views: IConnectorProxiesView[]
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
        projectId: string, views: IConnectorProxiesView[]
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

        this.subscription.unsubscribe();
    }

    async unsubscribeAsync(): Promise<void> {
        if (this.projectId) {
            await this.events.unregisterAsync({
                scope: EEventScope.PROXIES,
                projectId: this.projectId,
            });
        }

        this.subscription.unsubscribe();
    }

    private subscribeImpl(
        projectId: string, views: IConnectorProxiesView[]
    ) {
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
                    break;
                }
            }
        }));

        this.projectId = projectId;
        this.proxiesOnlineCount = 0;
        this.proxiesMap.clear();
        this.views.length = 0;
        this.viewsMap.clear();

        const viewsSorted = views.sort((
            a, b
        ) => a.connector.name.localeCompare(b.connector.name));

        for (const view of viewsSorted) {
            view.proxies.sort((
                a, b
            ) => a.key.localeCompare(b.key));

            this.views.push(view);

            // Don't use addProxy because this function resets requests, bytesReceived and bytesSend properties to 0
            this.viewsMap.set(
                view.connector.id,
                view
            );

            for (const proxy of view.proxies) {
                this.proxiesMap.set(
                    proxy.id,
                    proxy
                );

                if (isProxyOnline(proxy)) {
                    this.proxiesOnlineCount += 1;
                }
            }
        }
    }

    private onConnectorCreated(connector: IConnectorView) {
        if (!this.projectId ||
            this.projectId !== connector.projectId) {
            return;
        }

        const view: IConnectorProxiesView = {
            connector: {
                ...connector,
            },
            proxies: [],
        };

        this.views.push(view);
        this.views.sort((
            a, b
        )=> a.connector.name.localeCompare(b.connector.name));

        this.viewsMap.set(
            view.connector.id,
            view
        );
    }

    private onConnectorUpdated(connector: IConnectorView) {
        if (!this.projectId ||
            this.projectId !== connector.projectId) {
            return;
        }

        const view = this.viewsMap.get(connector.id);

        if (!view) {
            return;
        }

        view.connector = connector;

        this.views.sort((
            a, b
        )=> a.connector.name.localeCompare(b.connector.name));
    }

    private onConnectorRemoved(connector: IConnectorView) {
        if (!this.projectId ||
            this.projectId !== connector.projectId) {
            return;
        }

        const view = this.viewsMap.get(connector.id);

        if (view) {
            for (const proxy of view.proxies) {
                this.proxiesMap.delete(proxy.id);

                if (isProxyOnline(proxy)) {
                    this.proxiesOnlineCount -= 1;
                }
            }

            this.viewsMap.delete(connector.id);
        }

        const ind = this.views.findIndex((v) => v.connector.id === connector.id);

        if (ind >= 0) {
            this.views.splice(
                ind,
                1
            );
        }
    }

    private onProxiesSynchronized(actions: ISynchronizeLocalProxiesBase) {
        for (const proxy of actions.created) {
            this.addProxy(proxy);
        }

        for (const proxy of actions.updated) {
            this.updateProxy(proxy);
        }

        for (const proxy of actions.removed) {
            this.removeProxy(proxy);
        }

    }

    private addProxy(proxy: IProxyBase) {
        if (!this.projectId ||
            this.projectId !== proxy.projectId) {
            return;
        }

        const view = this.viewsMap.get(proxy.connectorId);

        if (!view) {
            return;
        }

        const proxyFound = view.proxies.find((p) => p.id === proxy.id);

        if (proxyFound) {
            return;
        }

        const proxyCreated: IProxyView = {
            ...proxy,
            requests: 0,
            bytesReceived: 0,
            bytesSent: 0,
        };

        view.proxies.push(proxyCreated);
        view.proxies.sort((
            a, b
        ) => a.key.localeCompare(b.key));

        this.proxiesMap.set(
            proxyCreated.id,
            proxyCreated
        );

        if (isProxyOnline(proxyCreated)) {
            this.proxiesOnlineCount += 1;
        }
    }

    private updateProxy(proxy: IProxyBase) {
        const proxyFound = this.proxiesMap.get(proxy.id);

        if (!proxyFound) {
            return;
        }

        const onlineOld = isProxyOnline(proxyFound);

        proxyFound.status = proxy.status;
        proxyFound.removing = proxy.removing;
        proxyFound.removingForce = proxy.removingForce;
        proxyFound.fingerprint = proxy.fingerprint;
        proxyFound.fingerprintError = proxy.fingerprintError;

        const onlineNew = isProxyOnline(proxyFound);

        if (onlineOld) {
            if (!onlineNew) {
                this.proxiesOnlineCount -= 1;
            }
        } else {
            if (onlineNew) {
                this.proxiesOnlineCount += 1;
            }
        }
    }

    private removeProxy(proxy: IProxyBase) {
        const proxyFound = this.proxiesMap.get(proxy.id);

        if (!proxyFound) {
            return;
        }

        const view = this.viewsMap.get(proxy.connectorId);

        if (view) {
            const ind = view.proxies.findIndex((p) => p.id === proxy.id);

            if (ind >= 0) {
                const proxyConnectorFound = view.proxies[ ind ];

                if (isProxyOnline(proxyConnectorFound)) {
                    this.proxiesOnlineCount -= 1;
                }

                view.proxies.splice(
                    ind,
                    1
                );
            }
        }

        this.proxiesMap.delete(proxy.id);
    }

    private onProxiesMetricsAdded(proxies: IProxyMetricsAdd[]) {
        if (!this.projectId) {
            return;
        }

        for (const proxy of proxies) {
            if (this.projectId === proxy.projectId) {
                const proxyFound = this.proxiesMap.get(proxy.id);

                if (proxyFound) {
                    proxyFound.requests += proxy.requests;
                    proxyFound.bytesReceived += proxy.bytesReceived;
                    proxyFound.bytesSent += proxy.bytesSent;
                }
            }
        }
    }
}
