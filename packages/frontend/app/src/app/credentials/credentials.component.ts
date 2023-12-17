import {
    Component,
    Inject,
} from '@angular/core';
import {
    ActivatedRoute,
    Router,
} from '@angular/router';
import { EventsCredentialsClient } from '@scrapoxy/common';
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
import type { ICommanderFrontendClient } from '@scrapoxy/common';


@Component({
    templateUrl: './credentials.component.html',
    styleUrls: [
        './credentials.component.scss',
    ],
})
export class CredentialsComponent implements OnInit, OnDestroy {
    readonly client: EventsCredentialsClient;

    projectId: string;

    projectName = '';

    constructor(
        @Inject(CommanderFrontendClientService)
        private readonly commander: ICommanderFrontendClient,
        events: EventsService,
        projectCurrentService: ProjectCurrentService,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly toastsService: ToastsService
    ) {
        this.client = new EventsCredentialsClient(events);

        projectCurrentService.project$.subscribe((value) => {
            this.projectName = value?.name ?? '';
        });
    }

    async ngOnInit(): Promise<void> {
        this.projectId = this.route.snapshot.params.projectId;

        try {
            const credentials = await this.commander.getAllProjectCredentials(
                this.projectId,
                null
            );

            if (credentials.length <= 0) {
                await this.router.navigate([
                    '/projects', this.projectId, 'marketplace',
                ]);

                return;
            }

            this.client.subscribe(
                this.projectId,
                credentials
            );
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Credentials',
                err.message
            );
        }
    }

    ngOnDestroy() {
        this.client.unsubscribe();
    }
}
