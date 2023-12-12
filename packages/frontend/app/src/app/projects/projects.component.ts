import {
    Component,
    Inject,
} from '@angular/core';
import { Router } from '@angular/router';
import {
    CommanderFrontendClientService,
    ToastsService,
} from '@scrapoxy/frontend-sdk';
import type { OnInit } from '@angular/core';
import type {
    ICommanderFrontendClient,
    IProjectView,
} from '@scrapoxy/common';


@Component({
    templateUrl: 'projects.component.html',
})
export class ProjectsComponent implements OnInit {
    projects: IProjectView[] = [];

    constructor(
        @Inject(CommanderFrontendClientService)
        private readonly commander: ICommanderFrontendClient,
        private readonly router: Router,
        private readonly toastsService: ToastsService
    ) {
    }

    async ngOnInit(): Promise<void> {
        try {
            this.projects = await this.commander.getAllProjectsForUserId()
                .then((projects) => projects.sort((
                    a, b
                )=>a.name.localeCompare(b.name)));

            if (this.projects.length <= 0) {
                await this.router.navigate([
                    '/projects', 'create',
                ]);

                // return; // Not needed, last command
            }
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Projects',
                err.message
            );
        }
    }

    async selectProject(project: IProjectView): Promise<void> {
        await this.router.navigate([
            '/projects', project.id,
        ]);
    }
}
