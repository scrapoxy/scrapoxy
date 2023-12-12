import {
    Component,
    Inject,
} from '@angular/core';
import { EProjectStatus } from '@scrapoxy/common';
import {
    CommanderFrontendClientService,
    ProjectCurrentService,
    ToastsService,
} from '@scrapoxy/frontend-sdk';
import type {
    ICommanderFrontendClient,
    IProjectData,
} from '@scrapoxy/common';


@Component({
    selector: 'project-status',
    templateUrl: 'project-status.component.html',
    styleUrls: [
        'project-status.component.scss',
    ],
})
export class ProjectStatusComponent {
    EProjectStatus = EProjectStatus;

    project: IProjectData | undefined = void 0;

    constructor(
        @Inject(CommanderFrontendClientService)
        private readonly commander: ICommanderFrontendClient,
        projectCurrentService: ProjectCurrentService,
        private readonly toastsService: ToastsService
    ) {
        projectCurrentService.project$.subscribe((value) => {
            this.project = value;
        });
    }

    async update(status: EProjectStatus): Promise<void> {
        if (!this.project) {
            return;
        }

        try {
            await this.commander.setProjectStatus(
                this.project.id,
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



