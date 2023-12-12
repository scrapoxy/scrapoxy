import { Subscription } from 'rxjs';
import { AEventsService } from '../events.abstract';
import {
    EEventScope,
    FreeproxiesCreatedEvent,
    FreeproxiesRemovedEvent,
    FreeproxiesUpdatedEvent,
} from '../events.interface';
import type {
    IFreeproxy,
    IFreeproxyRefreshed,
} from '../../freeproxies';


export class EventsFreeproxiesClient {
    readonly freeproxies: IFreeproxy[] = [];

    private connectorId: string | undefined = void 0;

    private readonly freeproxiesMap = new Map<string, IFreeproxy>();

    private projectId: string | undefined = void 0;

    private readonly subscription = new Subscription();

    constructor(
        private readonly events: AEventsService,
        private readonly onFreeproxiesCreated?: (freeproxies: IFreeproxy[]) => void,
        private readonly onFreeproxiesRemoved?: (freeproxiesIdsRemoved: string[]) => void
    ) { }

    subscribe(
        projectId: string,
        connectorId: string,
        freeproxies: IFreeproxy[]
    ) {
        this.subscribeImpl(
            projectId,
            connectorId,
            freeproxies
        );

        this.events.register({
            scope: EEventScope.FREEPROXIES,
            projectId,
        });
    }

    async subscribeAsync(
        projectId: string,
        connectorId: string,
        freeproxies: IFreeproxy[]
    ): Promise<void> {
        await this.events.registerAsync({
            scope: EEventScope.FREEPROXIES,
            projectId,
        });

        this.subscribeImpl(
            projectId,
            connectorId,
            freeproxies
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
        freeproxies: IFreeproxy[]
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

                case FreeproxiesUpdatedEvent.id: {
                    const updated = event as FreeproxiesUpdatedEvent;
                    this.onFreeproxiesUpdatedImpl(updated.freeproxies);
                    break;
                }

                case FreeproxiesRemovedEvent.id: {
                    const removed = event as FreeproxiesRemovedEvent;
                    this.onFreeproxiesRemovedImpl(removed.freeproxiesIdsRemoved);
                    break;
                }
            }
        }));

        this.projectId = projectId;
        this.connectorId = connectorId;

        this.freeproxies.length = 0;
        this.freeproxiesMap.clear();

        this.onFreeproxiesCreatedImpl(freeproxies);
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

        if (this.onFreeproxiesCreated) {
            this.onFreeproxiesCreated(freeproxies);
        }
    }

    private onFreeproxiesUpdatedImpl(freeproxies: IFreeproxyRefreshed[]) {
        if (!this.projectId ||
            !this.connectorId) {
            return;
        }

        for (const freeproxy of freeproxies) {
            if (freeproxy.projectId === this.projectId &&
                freeproxy.connectorId === this.connectorId) {
                const freeproxyFound = this.freeproxiesMap.get(freeproxy.id);

                if (freeproxyFound) {
                    freeproxyFound.fingerprint = freeproxy.fingerprint;
                    freeproxyFound.fingerprintError = freeproxy.fingerprintError;
                }
            }
        }
    }

    private onFreeproxiesRemovedImpl(freeproxiesIdsRemoved: string[]) {
        if (!this.projectId ||
            !this.connectorId ||
            freeproxiesIdsRemoved.length <= 0) {
            return;
        }

        for (const id of freeproxiesIdsRemoved) {
            const freeproxyFound = this.freeproxiesMap.get(id);

            if (freeproxyFound) {
                const index = this.freeproxies.findIndex((c) => c.id === id);
                this.freeproxies.splice(
                    index,
                    1
                );

                this.freeproxiesMap.delete(id);
            }
        }

        if (this.onFreeproxiesRemoved) {
            this.onFreeproxiesRemoved(freeproxiesIdsRemoved);
        }
    }
}
