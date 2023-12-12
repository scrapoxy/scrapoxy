import {
    Component,
    Inject,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
    CommanderFrontendClientService,
    ConfirmService,
    ProjectCurrentService,
    ToastsService,
} from '@scrapoxy/frontend-sdk';
import type { OnInit } from '@angular/core';
import type {
    ICommanderFrontendClient,
    IUserProject,
} from '@scrapoxy/common';


@Component({
    templateUrl: './users.component.html',
    styleUrls: [
        './users.component.scss',
    ],
})
export class UsersComponent implements OnInit {
    projectId: string;

    projectName = '';

    users: IUserProject[] = [];

    usersLoaded = false;

    constructor(
        @Inject(CommanderFrontendClientService)
        private readonly commander: ICommanderFrontendClient,
        private readonly confirmService: ConfirmService,
        projectCurrentService: ProjectCurrentService,
        private readonly route: ActivatedRoute,
        private readonly toastsService: ToastsService
    ) {
        projectCurrentService.project$.subscribe((value) => {
            this.projectName = value?.name ?? '';
        });
    }

    async ngOnInit(): Promise<void> {
        this.projectId = this.route.snapshot.params.projectId;

        try {
            this.users = await this.commander.getAllProjectUsersById(this.projectId)
                .then((users) => users.sort((
                    a, b
                ) => a.name.localeCompare(b.name)));

            this.usersLoaded = true;
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Users',
                err.message
            );
        }
    }


    async removeUserWithConfirm(user: IUserProject): Promise<void> {
        const accept = await this
            .confirmService.confirm(
                'Remove User',
                `Do you want to remove user "${user.name} (${user.email})" ?`
            );

        if (!accept) {
            return;
        }

        await this.removeUser(user);
    }

    private async removeUser(user: IUserProject): Promise<void> {
        try {
            await this.commander.removeUserFromProject(
                this.projectId,
                user.id
            );

            const ind = this.users.findIndex((u) => u.id === user.id);

            if (ind >= 0) {
                this.users.splice(
                    ind,
                    1
                );
            }

            this.toastsService.success(
                'User',
                `User "${user.name}" removed.`
            );
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Project Update',
                err.message
            );
        }
    }
}
