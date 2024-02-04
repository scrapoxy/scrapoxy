import {
    Component,
    Inject,
} from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import {
    ONE_MINUTE_IN_MS,
    ONE_SECOND_IN_MS,
} from '@scrapoxy/common';
import {
    CommanderFrontendClientService,
    ToastsService,
} from '@scrapoxy/frontend-sdk';
import { ValidatorOptionalNumber } from '../../../sharedspx/input-optional/input-optional-number.component';
import { ValidatorRange } from '../../../sharedspx/input-range/input-range.component';
import type {
    ICommanderFrontendClient,
    IProjectToCreate,
} from '@scrapoxy/common';
import type { IHasModification } from '@scrapoxy/frontend-sdk';


@Component({
    templateUrl: 'create.component.html',
})
export class ProjectCreateComponent implements IHasModification {
    form: FormGroup;

    processing = false;

    constructor(
        @Inject(CommanderFrontendClientService)
        private readonly commander: ICommanderFrontendClient,
        fb: FormBuilder,
        private readonly router: Router,
        private readonly toastsService: ToastsService
    ) {
        this.form = fb.group({
            name: [
                'My Project', Validators.required,
            ],
            autoRotate: [
                true, Validators.required,
            ],
            autoRotateDelayRange: [
                {
                    max: ONE_MINUTE_IN_MS * 30,
                    min: ONE_MINUTE_IN_MS * 30,
                },
                [
                    Validators.required,
                    ValidatorRange({
                        min: ONE_SECOND_IN_MS * 30,
                    }),
                ],
            ],
            autoScaleUp: [
                true, Validators.required,
            ],
            autoScaleDown: [
                {
                    enabled: true,
                    value: ONE_MINUTE_IN_MS * 10,
                },
                [
                    Validators.required,
                    ValidatorOptionalNumber({
                        min: ONE_SECOND_IN_MS * 30,
                    }),
                ],
            ],
            cookieSession: [
                true, Validators.required,
            ],
            mitm: [
                true, Validators.required,
            ],
            proxiesMin: [
                1,
                [
                    Validators.required, Validators.min(1),
                ],
            ],
            useragentOverride: [
                false, Validators.required,
            ],
        });

        this.onChangeMitm();
        this.onChangeAutoRotate();
    }

    isModified(): boolean {
        return !this.form.pristine;
    }

    async create(): Promise<void> {
        this.processing = true;

        const projectToCreate: IProjectToCreate = {
            name: this.form.value.name,
            autoRotate: this.form.value.autoRotate,
            autoScaleUp: this.form.value.autoScaleUp,
            autoScaleDown: this.form.value.autoScaleDown ?? {
                enabled: true,
                value: ONE_MINUTE_IN_MS * 10,
            },
            proxiesMin: this.form.value.proxiesMin,
            // We use default value because fields can be disabled
            cookieSession: this.form.value.cookieSession ?? false,
            mitm: this.form.value.mitm ?? false,
            useragentOverride: this.form.value.useragentOverride ?? false,
            autoRotateDelayRange: this.form.value.autoRotateDelayRange ?? {
                min: ONE_MINUTE_IN_MS * 30,
                max: ONE_MINUTE_IN_MS * 30,
            },
        };

        try {
            const project = await this.commander.createProject(projectToCreate);

            this.form.markAsPristine();

            this.toastsService.success(
                'Project',
                `Project "${project.name}" created.`
            );

            await this.router.navigate([
                '/projects', project.id,
            ]);
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Project Create',
                err.message
            );
        } finally {
            this.processing = false;
        }
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
}
