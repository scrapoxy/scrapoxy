import {
    Component,
    Inject,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
    EventsTasksClient,
    isTaskFailed,
    isTaskSucceed,
} from '@scrapoxy/common';
import {
    CommanderFrontendClientService,
    EventsService,
    ProjectCurrentService,
    ToastsService,
} from '@scrapoxy/frontend-sdk';
import type {
    OnDestroy,
    OnInit,
} from '@angular/core';
import type {
    ICommanderFrontendClient,
    ITaskView,
} from '@scrapoxy/common';


@Component({
    templateUrl: './tasks.component.html',
})
export class TasksComponent implements OnInit, OnDestroy {
    readonly client: EventsTasksClient;

    projectId: string;

    projectName = '';

    constructor(
        @Inject(CommanderFrontendClientService)
        private readonly commander: ICommanderFrontendClient,
        private readonly events: EventsService,
        projectCurrentService: ProjectCurrentService,
        private readonly route: ActivatedRoute,
        private readonly toastsService: ToastsService
    ) {
        this.client = new EventsTasksClient(this.events);

        projectCurrentService.project$.subscribe((value) => {
            this.projectName = value?.name ?? '';
        });
    }

    async ngOnInit(): Promise<void> {
        this.projectId = this.route.snapshot.params.projectId;

        try {
            const tasks = await this.commander.getAllProjectTasksById(this.projectId);

            this.client.subscribe(
                this.projectId,
                tasks
            );
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Tasks',
                err.message
            );
        }
    }

    ngOnDestroy() {
        this.client.unsubscribe();
    }

    isTaskSucceed(task: ITaskView): boolean {
        return isTaskSucceed(task);
    }

    isTaskFailed(task: ITaskView): boolean {
        return isTaskFailed(task);
    }
}
