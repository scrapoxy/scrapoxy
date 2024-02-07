import {
    Component,
    Inject,
} from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    Validators,
} from '@angular/forms';
import {
    ActivatedRoute,
    Router,
} from '@angular/router';
import {
    CommanderFrontendClientService,
    ProjectCurrentService,
    ToastsService,
} from '@scrapoxy/frontend-sdk';
import type { OnInit } from '@angular/core';
import type { ICommanderFrontendClient } from '@scrapoxy/common';
import type { IHasModification } from '@scrapoxy/frontend-sdk';


@Component({
    templateUrl: './add.component.html',
})
export class UserAddComponent implements IHasModification, OnInit {
    form: FormGroup;

    processing = false;

    projectId: string;

    projectName = '';

    constructor(
        @Inject(CommanderFrontendClientService)
        private readonly commander: ICommanderFrontendClient,
        fb: FormBuilder,
        projectCurrentService: ProjectCurrentService,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly toastsService: ToastsService
    ) {
        this.form = fb.group({
            email: [
                void 0, Validators.required,
            ],
        });

        projectCurrentService.project$.subscribe((value) => {
            this.projectName = value?.name ?? '';
        });
    }

    ngOnInit() {
        this.projectId = this.route.snapshot.params.projectId;
    }

    isModified(): boolean {
        return !this.form.pristine;
    }

    async add(): Promise<void> {
        this.processing = true;

        const addUserEmail = this.form.value.email;

        try {
            const user = await this.commander.addUserToProjectByEmail(
                this.projectId,
                addUserEmail
            );

            this.form.markAsPristine();

            this.toastsService.success(
                'User',
                `User "${user.name}" add.`
            );

            await this.router.navigate([
                '/projects', this.projectId, 'users',
            ]);
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'User Add',
                err.message
            );
        } finally {
            this.processing = false;
        }
    }
}
