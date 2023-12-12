import { Component } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    Validators,
} from '@angular/forms';
import {
    CommanderUsersClientService,
    ToastsService,
} from '@scrapoxy/frontend-sdk';
import type { OnInit } from '@angular/core';
import type {
    IUserToUpdate,
    IUserView,
} from '@scrapoxy/common';


@Component({
    templateUrl: 'update.component.html',
})
export class ProfileUpdateComponent implements OnInit {
    user: IUserView | undefined = void 0;

    form: FormGroup;

    processing = false;

    constructor(
        private readonly commander: CommanderUsersClientService,
        fb: FormBuilder,
        private readonly toastsService: ToastsService
    ) {
        this.form = fb.group({
            name: [
                void 0, Validators.required,
            ],
            email: [
                void 0,
                [
                    Validators.required, Validators.email,
                ],
            ],
            picture: [
                void 0, Validators.required,
            ],
        });
    }

    async ngOnInit(): Promise<void> {
        try {
            this.user = await this.commander.getUserMe();
            this.form.patchValue(this.user);

        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Profile Update',
                err.message
            );
        }
    }

    isModified(): boolean {
        return !this.form.pristine;
    }

    async update(): Promise<void> {
        this.processing = true;

        const userToUpdate: IUserToUpdate = this.form.value;

        try {
            const complete = (this.user as IUserView).complete;

            this.user = await this.commander.updateUserMe(userToUpdate);

            this.toastsService.success(
                'Profile',
                'Profile updated.'
            );

            if (complete !== this.user.complete) {
                this.commander.renew('/profile');
            } else {
                this.form.markAsPristine();
            }
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Profile Update',
                err.message
            );
        } finally {
            this.processing = false;
        }
    }
}
