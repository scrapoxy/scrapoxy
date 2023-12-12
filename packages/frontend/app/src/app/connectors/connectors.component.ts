import {
    Component,
    Inject,
} from '@angular/core';
import {
    ActivatedRoute,
    Router,
} from '@angular/router';
import {
    EProjectStatus,
    EventsConnectorsClient,
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
    IProjectData,
} from '@scrapoxy/common';


@Component({
    templateUrl: 'connectors.component.html',
})
export class ConnectorsComponent implements OnInit, OnDestroy {
    EProjectStatus = EProjectStatus;

    readonly client: EventsConnectorsClient;

    project: IProjectData | undefined = void 0;

    projectId: string;

    constructor(
        @Inject(CommanderFrontendClientService)
        private readonly commander: ICommanderFrontendClient,
        private readonly events: EventsService,
        projectCurrentService: ProjectCurrentService,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly toastsService: ToastsService
    ) {
        this.client = new EventsConnectorsClient(this.events);

        projectCurrentService.project$.subscribe((value) => {
            this.project = value;
        });
    }

    async ngOnInit(): Promise<void> {
        this.projectId = this.route.snapshot.params.projectId;

        try {
            const views = await this.commander.getAllProjectConnectorsAndProxiesById(this.projectId);

            if (views.length <= 0) {
                await this.router.navigate([
                    '/projects',
                    this.projectId,
                    'connectors',
                    'create',
                ]);

                return;
            }

            this.client.subscribe(
                this.projectId,
                views
            );
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Connectors',
                err.message
            );
        }
    }

    ngOnDestroy() {
        this.client.unsubscribe();
    }

    async updateStatus(status: EProjectStatus): Promise<void> {
        try {
            await this.commander.setProjectStatus(
                this.projectId,
                status
            );
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Connectors',
                err.message
            );
        }
    }
}



