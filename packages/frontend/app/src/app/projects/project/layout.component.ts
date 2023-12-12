import {
    Component,
    Inject,
} from '@angular/core';
import {
    ActivatedRoute,
    Router,
} from '@angular/router';
import {
    ConnectorCreatedEvent,
    ConnectorRemovedEvent,
    EEventScope,
    EProjectStatus,
    ProjectRemovedEvent,
    ProjectSelectedEvent,
    ProjectUpdatedEvent,
    TaskCreatedEvent,
} from '@scrapoxy/common';
import {
    CommanderFrontendClientService,
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
    IConnectorView,
    IProjectData,
    ITaskView,
} from '@scrapoxy/common';


@Component({
    template: '<router-outlet></router-outlet>',
})
export class ProjectLayoutComponent implements OnInit, OnDestroy {
    private projectId: string;

    private readonly subscription = new Subscription();

    private projectStatus: EProjectStatus | undefined;

    constructor(
        @Inject(CommanderFrontendClientService)
        private readonly commander: ICommanderFrontendClient,
        private readonly events: EventsService,
        private readonly projectCurrentService: ProjectCurrentService,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly toastsService: ToastsService
    ) {}

    async ngOnInit(): Promise<void> {
        this.projectId = this.route.snapshot.params.projectId;

        this.subscription.add(this.events.event$.subscribe((event) => {
            if (!event) {
                return;
            }

            switch (event.id) {
                case ProjectUpdatedEvent.id: {
                    const updated = event as ProjectUpdatedEvent;
                    const project = updated.project;

                    if (this.projectId !== project.id) {
                        return;
                    }

                    this.onProjectUpdated(project);

                    break;
                }

                case ProjectRemovedEvent.id: {
                    const removed = event as ProjectRemovedEvent;
                    const project = removed.project;

                    if (this.projectId !== project.id) {
                        return;
                    }

                    this.onProjectRemoved(project);

                    break;
                }

                case ConnectorCreatedEvent.id: {
                    const created = event as ConnectorCreatedEvent;
                    const connector = created.connector;

                    if (this.projectId !== connector.projectId) {
                        return;
                    }

                    this.onConnectorCreated(connector);

                    break;
                }

                case ConnectorRemovedEvent.id: {
                    const removed = event as ConnectorRemovedEvent;
                    const connector = removed.connector;

                    if (this.projectId !== connector.projectId) {
                        return;
                    }

                    this.onConnectorRemoved(connector);

                    break;
                }

                case TaskCreatedEvent.id: {
                    const created = event as TaskCreatedEvent;
                    const task = created.task;

                    if (this.projectId !== task.projectId) {
                        return;
                    }

                    this.onTaskCreated(task);

                    break;
                }
            }
        }));

        try {
            const project = await this.commander.getProjectById(this.projectId);

            this.projectCurrentService.add(project);
            this.projectStatus = project.status;

            this.events.register({
                scope: EEventScope.PROJECT,
                projectId: project.id,
            });

            this.events.emit(new ProjectSelectedEvent(project));
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Project Layout',
                err.message
            );
        }
    }

    ngOnDestroy() {
        this.events.emit(new ProjectSelectedEvent(void 0));

        this.events.unregister({
            scope: EEventScope.PROJECT,
            projectId: this.projectId,
        });

        this.subscription.unsubscribe();
    }

    private onProjectUpdated(project: IProjectData) {
        this.projectCurrentService.add(project);

        if (this.projectStatus !== project.status) {
            this.toastsService.success(
                'Project',
                `Project status changed to ${project.status.toUpperCase()}`
            );

            this.projectStatus = project.status;
        }
    }

    private onProjectRemoved(project: IProjectData) {
        this.projectCurrentService.clear();
        this.projectStatus = void 0;

        this.toastsService.success(
            'Project',
            `Project "${project.name}" removed.`
        );

        this.router.navigate([
            '/projects',
        ])
            .catch((err: any)=>{
                console.error(err);

                this.toastsService.error(
                    'Project Layout',
                    err.message
                );
            });
    }

    private onConnectorCreated(connector: IConnectorView) {
        this.toastsService.success(
            'Connector',
            `Connector "${connector.name}" created.`
        );
    }

    private onConnectorRemoved(connector: IConnectorView) {
        this.toastsService.success(
            'Connector',
            `Connector "${connector.name}" removed.`
        );
    }

    private onTaskCreated(task: ITaskView) {
        this.toastsService.success(
            `Task ${task.type}`,
            task.message
        );
    }
}



