import { Subscription } from 'rxjs';
import { MetricsStore } from '../../projects';
import { AEventsService } from '../events.abstract';
import {
    EEventScope,
    ProjectMetricsAddedEvent,
} from '../events.interface';
import type { IProjectMetricsAddView } from '../../projects';


export class EventsMetricsClient {
    store: MetricsStore | undefined = void 0;

    private projectId: string | undefined = void 0;

    private readonly subscription = new Subscription();

    constructor(
        private readonly events: AEventsService,
        private readonly onProjectMetricsAddedImpl?: () => void
    ) {}

    subscribe(
        projectId: string,
        store: MetricsStore
    ) {
        this.subscribeImpl(
            projectId,
            store
        );

        this.events.register({
            scope: EEventScope.METRICS,
            projectId,
        });
    }

    async subscribeAsync(
        projectId: string,
        store: MetricsStore
    ): Promise<void> {
        this.subscribeImpl(
            projectId,
            store
        );

        await this.events.registerAsync({
            scope: EEventScope.METRICS,
            projectId,
        });
    }

    unsubscribe() {
        if (this.projectId) {
            this.events.unregister({
                scope: EEventScope.METRICS,
                projectId: this.projectId,
            });
        }

        this.subscription.unsubscribe();
    }

    async unsubscribeAsync(): Promise<void> {
        if (this.projectId) {
            await this.events.unregisterAsync({
                scope: EEventScope.METRICS,
                projectId: this.projectId,
            });
        }

        this.subscription.unsubscribe();
    }

    private subscribeImpl(
        projectId: string,
        store: MetricsStore
    ) {
        this.subscription.add(this.events.event$.subscribe((event) => {
            if (!event) {
                return;
            }

            switch (event.id) {
                case ProjectMetricsAddedEvent.id: {
                    const added = event as ProjectMetricsAddedEvent;
                    this.onProjectMetricsAdded(added.view);
                    break;
                }
            }
        }));

        this.projectId = projectId;
        this.store = store;
    }

    private onProjectMetricsAdded(view: IProjectMetricsAddView) {
        if (!this.projectId ||
            !this.store ||
            this.projectId !== view.project.id) {
            return;
        }

        this.store.add(view);

        if (this.onProjectMetricsAddedImpl) {
            this.onProjectMetricsAddedImpl();
        }
    }
}
