import { Subscription } from 'rxjs';
import { AEventsService } from '../events.abstract';
import {
    EEventScope,
    FreeproxiesCreatedEvent,
    FreeproxiesSynchronizedEvent,
    SourcesCreatedEvent,
    SourcesRemovedEvent,
    SourcesUpdatedEvent,
} from '../events.interface';
import type {
    IFreeproxy,
    ISource,
    ISourcesAndFreeproxies,
    ISynchronizeFreeproxies,
} from '../../freeproxies';


export class EventsFreeproxiesClient {
    readonly freeproxies: IFreeproxy[] = [];

    readonly sources: ISource[] = [];

    private connectorId: string | undefined = void 0;

    private readonly sourcesMap = new Map<string, ISource>();

    private readonly freeproxiesMap = new Map<string, IFreeproxy>();

    private projectId: string | undefined = void 0;

    private readonly subscription = new Subscription();

    constructor(
        private readonly events: AEventsService,
        private readonly onSourcesEvent?: () => void,
        private readonly onFreeproxiesEvent?: () => void
    ) {}

    subscribe(
        projectId: string,
        connectorId: string,
        sourcesAndFreeproxies: ISourcesAndFreeproxies
    ) {
        this.subscribeImpl(
            projectId,
            connectorId,
            sourcesAndFreeproxies
        );

        this.events.register({
            scope: EEventScope.FREEPROXIES,
            projectId,
        });
    }

    async subscribeAsync(
        projectId: string,
        connectorId: string,
        sourcesAndFreeproxies: ISourcesAndFreeproxies
    ): Promise<void> {
        await this.events.registerAsync({
            scope: EEventScope.FREEPROXIES,
            projectId,
        });

        this.subscribeImpl(
            projectId,
            connectorId,
            sourcesAndFreeproxies
        );
    }

    unsubscribe() {
        if (this.projectId) {
            this.events.unregister({
                scope: EEventScope.FREEPROXIES,
                projectId: this.projectId,
            });
        }

        this.subscription.unsubscribe();
    }

    async unsubscribeAsync(): Promise<void> {
        if (this.projectId) {
            await this.events.unregisterAsync({
                scope: EEventScope.FREEPROXIES,
                projectId: this.projectId,
            });
        }

        this.subscription.unsubscribe();
    }

    private subscribeImpl(
        projectId: string,
        connectorId: string,
        sourcesAndFreeproxies: ISourcesAndFreeproxies
    ) {
        this.subscription.add(this.events.event$.subscribe((event) => {
            if (!event) {
                return;
            }

            switch (event.id) {
                case FreeproxiesCreatedEvent.id: {
                    const created = event as FreeproxiesCreatedEvent;
                    this.onFreeproxiesCreatedImpl(created.freeproxies);
                    break;
                }

                case FreeproxiesSynchronizedEvent.id: {
                    const sync = event as FreeproxiesSynchronizedEvent;
                    this.onFreeproxiesSyncImpl(sync.actions);
                    break;
                }

                case SourcesCreatedEvent.id: {
                    const created = event as SourcesCreatedEvent;
                    this.onSourcesCreatedImpl(created.sources);
                    break;
                }

                case SourcesUpdatedEvent.id: {
                    const updated = event as SourcesUpdatedEvent;
                    this.onSourcesUpdatedImpl(updated.sources);
                    break;
                }

                case SourcesRemovedEvent.id: {
                    const removed = event as SourcesRemovedEvent;
                    this.onSourcesRemovedImpl(removed.sources);
                    break;
                }
            }
        }));

        this.projectId = projectId;
        this.connectorId = connectorId;

        this.sources.length = 0;
        this.sourcesMap.clear();

        this.freeproxies.length = 0;
        this.freeproxiesMap.clear();

        this.onSourcesCreatedImpl(sourcesAndFreeproxies.sources);
        this.onFreeproxiesCreatedImpl(sourcesAndFreeproxies.freeproxies);
    }

    private onSourcesCreatedImpl(sources: ISource[]) {
        if (!this.projectId ||
            !this.connectorId ||
            sources.length <= 0) {
            return;
        }

        for (const source of sources) {
            if (source.projectId === this.projectId &&
                source.connectorId === this.connectorId) {
                const index = this.sources.findIndex((c) => c.id === source.id);

                if (index < 0) {
                    this.sources.push(source);
                } else {
                    this.sources[ index ] = source;
                }

                this.sourcesMap.set(
                    source.id,
                    source
                );
            }
        }

        this.sources.sort((
            a, b
        ) => a.url.localeCompare(b.url));

        if (this.onSourcesEvent) {
            this.onSourcesEvent();
        }
    }

    private onSourcesUpdatedImpl(sources: ISource[]) {
        if (!this.projectId ||
            !this.connectorId ||
            sources.length <= 0) {
            return;
        }

        for (const source of sources) {
            if (source.projectId === this.projectId &&
                source.connectorId === this.connectorId) {
                const sourceFound = this.sources.find((c) => c.id === source.id);

                if (sourceFound) {
                    sourceFound.url = source.url;
                    sourceFound.delay = source.delay;
                    sourceFound.lastRefreshTs = source.lastRefreshTs;
                    sourceFound.lastRefreshError = source.lastRefreshError;
                }
            }
        }

        this.sources.sort((
            a, b
        ) => a.url.localeCompare(b.url));

        if (this.onSourcesEvent) {
            this.onSourcesEvent();
        }
    }

    private onSourcesRemovedImpl(sources: ISource[]) {
        if (!this.projectId ||
            !this.connectorId ||
            sources.length <= 0) {
            return;
        }

        for (const source of sources) {
            const sourceFound = this.sourcesMap.get(source.id);

            if (sourceFound) {
                const index = this.sources.findIndex((c) => c.id === source.id);
                this.sources.splice(
                    index,
                    1
                );

                this.sourcesMap.delete(source.id);
            }
        }

        if (this.onSourcesEvent) {
            this.onSourcesEvent();
        }
    }

    private onFreeproxiesCreatedImpl(freeproxies: IFreeproxy[]) {
        if (!this.projectId ||
            !this.connectorId ||
            freeproxies.length <= 0) {
            return;
        }

        for (const freeproxy of freeproxies) {
            if (freeproxy.projectId === this.projectId &&
                freeproxy.connectorId === this.connectorId) {
                const index = this.freeproxies.findIndex((c) => c.id === freeproxy.id);

                if (index < 0) {
                    this.freeproxies.push(freeproxy);
                } else {
                    this.freeproxies[ index ] = freeproxy;
                }

                this.freeproxiesMap.set(
                    freeproxy.id,
                    freeproxy
                );
            }
        }

        this.freeproxies.sort((
            a, b
        ) => a.key.localeCompare(b.key));

        if (this.onFreeproxiesEvent) {
            this.onFreeproxiesEvent();
        }
    }

    private onFreeproxiesSyncImpl(actions: ISynchronizeFreeproxies) {
        if (!this.projectId ||
            !this.connectorId) {
            return;
        }

        for (const freeproxy of actions.updated) {
            if (freeproxy.projectId === this.projectId &&
                freeproxy.connectorId === this.connectorId) {
                const freeproxyFound = this.freeproxiesMap.get(freeproxy.id);

                if (freeproxyFound) {
                    freeproxyFound.fingerprint = freeproxy.fingerprint;
                    freeproxyFound.fingerprintError = freeproxy.fingerprintError;
                }
            }
        }

        if (actions.removed.length > 0) {
            for (const freeproxy of actions.removed) {
                const freeproxyFound = this.freeproxiesMap.get(freeproxy.id);

                if (freeproxyFound) {
                    const index = this.freeproxies.findIndex((c) => c.id === freeproxy.id);
                    this.freeproxies.splice(
                        index,
                        1
                    );

                    this.freeproxiesMap.delete(freeproxy.id);
                }
            }

            if (this.onFreeproxiesEvent) {
                this.onFreeproxiesEvent();
            }
        }
    }
}
