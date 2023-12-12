import {
    Component,
    Inject,
} from '@angular/core';
import {
    ActivatedRoute,
    Router,
} from '@angular/router';
import {
    isTaskFailed,
    isTaskSucceed,
    TaskRemovedEvent,
    TaskUpdatedEvent,
} from '@scrapoxy/common';
import {
    CommanderFrontendClientService,
    ConfirmService,
    EventsService,
    ProjectCurrentService,
    ToastsService,
} from '@scrapoxy/frontend-sdk';
import { Subscription } from 'rxjs';
import type {
    OnDestroy,
    OnInit,
} from '@angular/core';
import type {
    ICommanderFrontendClient,
    ITaskView,
} from '@scrapoxy/common';


@Component({
    templateUrl: './task.component.html',
    styleUrls: [
        './task.component.scss',
    ],
})
export class TaskComponent implements OnInit, OnDestroy {
    task: ITaskView | undefined = void 0;

    processingCancel = false;

    projectId: string;

    projectName = '';

    taskId: string;

    private readonly subscription = new Subscription();

    constructor(
        @Inject(CommanderFrontendClientService)
        private readonly commander: ICommanderFrontendClient,
        private readonly confirmService: ConfirmService,
        private readonly events: EventsService,
        projectCurrentService: ProjectCurrentService,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly toastsService: ToastsService
    ) {
        projectCurrentService.project$.subscribe((value) => {
            this.projectName = value?.name ?? '';
        });
    }

    async ngOnInit(): Promise<void> {
        this.projectId = this.route.snapshot.params.projectId;
        this.taskId = this.route.snapshot.params.taskId;

        this.subscription.add(this.events.event$.subscribe((event) => {
            if (!event) {
                return;
            }

            switch (event.id) {
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

        try {
            this.task = await this.commander.getTaskById(
                this.projectId,
                this.taskId
            );
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Task',
                err.message
            );
        }
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    isTaskSucceed(task: ITaskView): boolean {
        return isTaskSucceed(task);
    }

    isTaskFailed(task: ITaskView): boolean {
        return isTaskFailed(task);
    }

    async cancelWithConfirm(): Promise<void> {
        const accept = await this
            .confirmService.confirm(
                'Remove Task',
                'Do you want to cancel this task?'
            );

        if (!accept) {
            return;
        }

        await this.cancel();
    }

    private async cancel(): Promise<void> {
        this.processingCancel = true;
        try {
            await this.commander.cancelTask(
                this.projectId,
                this.taskId
            );
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Task',
                err.message
            );
        } finally {
            this.processingCancel = false;
        }
    }

    private onTaskUpdated(task: ITaskView) {
        if (this.projectId !== task.projectId ||
            this.taskId !== task.id) {
            return;
        }

        this.task = task;
    }

    private onTaskRemoved(task: ITaskView) {
        if (this.projectId !== task.projectId ||
            this.taskId !== task.id) {
            return;
        }

        (async() => {
            await this.router.navigate([
                '/projects', this.projectId, 'update',
            ]);
        })()
            .catch(err => {
                console.error(err);

                this.toastsService.error(
                    'Task',
                    err.message
                );
            });
    }
}
