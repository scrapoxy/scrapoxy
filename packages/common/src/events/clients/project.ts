import { Subscription } from 'rxjs';
import { AEventsService } from '../events.abstract';
import {
    EEventScope,
    ProjectRemovedEvent,
    ProjectUpdatedEvent,
} from '../events.interface';
import type { IProjectData } from '../../projects';


export class EventsProjectClient {
    project: IProjectData | undefined = void 0;

    private readonly subscription = new Subscription();

    constructor(
        private readonly events: AEventsService,
        private readonly onProjectRemovedImpl?: () => void
    ) {}

    subscribe(project: IProjectData) {
        this.subscribeImpl(project);

        this.events.register({
            scope: EEventScope.PROJECT,
            projectId: project.id,
        });
    }

    async subscribeAsync(project: IProjectData): Promise<void> {
        this.subscribeImpl(project);

        await this.events.registerAsync({
            scope: EEventScope.PROJECT,
            projectId: project.id,
        });
    }

    unsubscribe() {
        this.events.unregister({
            scope: EEventScope.PROJECT,
            projectId: (this.project as IProjectData).id,
        });

        this.subscription.unsubscribe();
    }

    async unsubscribeAsync(): Promise<void> {
        await this.events.unregisterAsync({
            scope: EEventScope.PROJECT,
            projectId: (this.project as IProjectData).id,
        });

        this.subscription.unsubscribe();
    }

    private subscribeImpl(project: IProjectData) {
        this.subscription.add(this.events.event$.subscribe((event) => {
            if (!event) {
                return;
            }

            switch (event.id) {
                case ProjectUpdatedEvent.id: {
                    const updated = event as ProjectUpdatedEvent;
                    this.onProjectUpdated(updated.project);
                    break;
                }

                case ProjectRemovedEvent.id: {
                    const removed = event as ProjectRemovedEvent;
                    this.onProjectRemoved(removed.project);
                    break;
                }
            }
        }));

        this.project = project;
    }

    private onProjectUpdated(project: IProjectData) {
        if (!this.project ||
            this.project.id !== project.id) {
            return;
        }

        this.project = project;
    }

    private onProjectRemoved(project: IProjectData) {
        if (!this.project ||
            this.project.id !== project.id ||
            !this.onProjectRemovedImpl) {
            return;
        }

        this.onProjectRemovedImpl();
    }
}
