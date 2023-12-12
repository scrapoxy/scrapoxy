import { Subscription } from 'rxjs';
import { AEventsService } from '../events.abstract';
import {
    TaskCreatedEvent,
    TaskRemovedEvent,
    TaskUpdatedEvent,
} from '../events.interface';
import type { ITaskView } from '../../tasks';


export class EventsTasksClient {
    readonly tasks: ITaskView[] = [];

    private projectId: string | undefined = void 0;

    private readonly subscription = new Subscription();

    constructor(private readonly events: AEventsService) {}

    subscribe(
        projectId: string, tasks: ITaskView[]
    ) {
        this.subscription.add(this.events.event$.subscribe((event) => {
            if (!event) {
                return;
            }

            switch (event.id) {
                case TaskCreatedEvent.id: {
                    const created = event as TaskCreatedEvent;
                    this.onTaskCreated(created.task);
                    break;
                }

                case TaskUpdatedEvent.id: {
                    const updated = event as TaskUpdatedEvent;
                    this.onTaskUpdated(updated.task);
                    break;
                }

                case TaskRemovedEvent.id: {
                    const removed = event as TaskRemovedEvent;
                    this.onTaskRemoved(removed.task);
                    break;
                }
            }
        }));

        this.projectId = projectId;
        this.tasks.length = 0;
        this.tasks.push(...tasks);
    }

    unsubscribe() {
        this.subscription.unsubscribe();
    }

    private onTaskCreated(task: ITaskView) {
        if (!this.projectId ||
            this.projectId !== task.projectId) {
            return;
        }

        this.tasks.push(task);
    }

    private onTaskUpdated(task: ITaskView) {
        if (!this.projectId ||
            this.projectId !== task.projectId) {
            return;
        }

        const ind = this.tasks.findIndex((t) => t.id === task.id);

        if (ind < 0) {
            return;
        }

        this.tasks[ ind ] = task;
    }

    private onTaskRemoved(task: ITaskView) {
        if (!this.projectId ||
            this.projectId !== task.projectId) {
            return;
        }

        const ind = this.tasks.findIndex((t) => t.id === task.id);

        if (ind >= 0) {
            this.tasks.splice(
                ind,
                1
            );
        }
    }
}
