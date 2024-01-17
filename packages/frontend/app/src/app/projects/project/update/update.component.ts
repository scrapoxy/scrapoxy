import {
    Component,
    Inject,
} from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
    ONE_MINUTE_IN_MS,
    ONE_SECOND_IN_MS,
} from '@scrapoxy/common';
import {
    CommanderFrontendClientService,
    ConfirmService,
    copyToClipboard,
    ToastsService,
} from '@scrapoxy/frontend-sdk';
import { ValidatorRange } from '../../../sharedspx/input-range/input-range.component';
import type { OnInit } from '@angular/core';
import type {
    ICommanderFrontendClient,
    IProjectData,
    IProjectToUpdate,
} from '@scrapoxy/common';
import type { IHasModification } from '@scrapoxy/frontend-sdk';


@Component({
    templateUrl: './update.component.html',
    styleUrls: [
        './update.component.scss',
    ],
})
export class ProjectUpdateComponent implements OnInit, IHasModification {
    form: FormGroup;

    processingUpdate = false;

    processingRemove = false;

    project: IProjectData | undefined = void 0;

    projectId: string;

    username = '';

    password = '';

    passwordType = 'password';

    constructor(
        @Inject(CommanderFrontendClientService)
        private readonly commander: ICommanderFrontendClient,
        private readonly confirmService: ConfirmService,
        fb: FormBuilder,
        private readonly route: ActivatedRoute,
        private readonly toastsService: ToastsService
    ) {
        this.form = fb.group({
            name: [
                void 0, Validators.required,
            ],
            autoRotate: [
                void 0, Validators.required,
            ],
            autoRotateDelayRange: [
                void 0,
                [
                    Validators.required,
                    ValidatorRange({
                        min: ONE_SECOND_IN_MS * 30,
                    }),
                ],
            ],
            autoScaleUp: [
                void 0, Validators.required,
            ],
            autoScaleDown: [
                void 0, Validators.required,
            ],
            autoScaleDownDelay: [
                void 0,
                [
                    Validators.required, Validators.min(ONE_SECOND_IN_MS * 30),
                ],
            ],
            cookieSession: [
                void 0, Validators.required,
            ],
            mitm: [
                void 0, Validators.required,
            ],
            proxiesMin: [
                void 0,
                [
                    Validators.required, Validators.min(1),
                ],
            ],
            useragentOverride: [
                void 0, Validators.required,
            ],
        });
    }

    async ngOnInit(): Promise<void> {
        this.projectId = this.route.snapshot.params.projectId;

        try {
            const [
                project, tokenB64,
            ] = await Promise.all([
                this.commander.getProjectById(this.projectId), this.commander.getProjectTokenById(this.projectId),
            ]);

            this.project = project;
            this.form.patchValue(this.project);
            this.onChangeMitm();
            this.onChangeAutoRotate();
            this.onChangeAutoScaleDown();

            const tokenSplit = window.atob(tokenB64)
                .split(':');
            this.username = tokenSplit[ 0 ];
            this.password = tokenSplit[ 1 ];
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Project Update',
                err.message
            );
        }
    }

    isModified(): boolean {
        return !this.form.pristine;
    }

    async update(): Promise<void> {
        this.processingUpdate = true;

        const projectToUpdate: IProjectToUpdate = {
            name: this.form.value.name,
            autoRotate: this.form.value.autoRotate,
            autoScaleUp: this.form.value.autoScaleUp,
            autoScaleDown: this.form.value.autoScaleDown,
            proxiesMin: this.form.value.proxiesMin,
            // We use default value because fields can be disabled
            cookieSession: this.form.value.cookieSession ?? false,
            mitm: this.form.value.mitm ?? false,
            useragentOverride: this.form.value.useragentOverride ?? false,
            autoRotateDelayRange: this.form.value.autoRotateDelayRange ?? {
                min: ONE_MINUTE_IN_MS * 30,
                max: ONE_MINUTE_IN_MS * 30,
            },
            autoScaleDownDelay: this.form.value.autoScaleDownDelay ?? ONE_MINUTE_IN_MS * 10,
        };

        try {
            const project = await this.commander.updateProject(
                this.projectId,
                projectToUpdate
            );

            this.form.markAsPristine();

            this.toastsService.success(
                'Project',
                `Project "${project.name}" updated.`
            );
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Project Update',
                err.message
            );
        } finally {
            this.processingUpdate = false;
        }
    }

    async removeProjectWithConfirm(): Promise<void> {
        const accept = await this
            .confirmService.confirm(
                'Remove Project',
                `Do you want to delete project "${this.project!.name}" ?`
            );

        if (!accept) {
            return;
        }

        await this.removeProject();
    }

    async copyUsername(): Promise<void> {
        try {
            await copyToClipboard(this.username);

            this.toastsService.success(
                'Username',
                'Username copied to clipboard'
            );
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Project Update',
                'Cannot copy username to clipboard'
            );
        }
    }

    async copyPassword(): Promise<void> {
        try {
            await copyToClipboard(this.password);

            this.toastsService.success(
                'Password',
                'Password copied to clipboard'
            );
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Project Update',
                'Cannot copy password to clipboard'
            );
        }
    }

    async renewProjectTokenWithConfirm(): Promise<void> {
        const accept = await this
            .confirmService.confirm(
                'Renew Token',
                `Do you want to renew token ? It will disconnect all users!`
            );

        if (!accept) {
            return;
        }

        await this.renewProjectToken();
    }

    onChangeMitm() {
        if (this.form.value.mitm) {
            this.form.controls.cookieSession.enable();
            this.form.controls.useragentOverride.enable();
        } else {
            this.form.controls.cookieSession.setValue(false);
            this.form.controls.cookieSession.disable();

            this.form.controls.useragentOverride.setValue(false);
            this.form.controls.useragentOverride.disable();
        }
    }

    onChangeAutoRotate() {
        if (this.form.value.autoRotate) {
            this.form.controls.autoRotateDelayRange.enable();
        } else {
            this.form.controls.autoRotateDelayRange.disable();
        }
    }

    onChangeAutoScaleDown() {
        if (this.form.value.autoScaleDown) {
            this.form.controls.autoScaleDownDelay.enable();
        } else {
            this.form.controls.autoScaleDownDelay.disable();
        }
    }

    togglePasswordType() {
        if (this.passwordType === 'password') {
            this.passwordType = 'text';
        } else {
            this.passwordType = 'password';
        }
    }

    private async removeProject(): Promise<void> {
        this.processingRemove = true;
        try {
            // Toast already done in project-layout.component.ts
            await this.commander.removeProject(this.projectId);
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Project Update',
                err.message
            );
        } finally {
            this.processingRemove = false;
        }
    }

    private async renewProjectToken(): Promise<void> {
        try {
            const tokenB64 = await this.commander.renewProjectToken(this.projectId);
            const tokenSplit = window.atob(tokenB64)
                .split(':');
            this.username = tokenSplit[ 0 ];
            this.password = tokenSplit[ 1 ];

            this.toastsService.success(
                'Token',
                'Token renewed'
            );
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Project Update',
                'Cannot renew token'
            );
        }
    }
}
