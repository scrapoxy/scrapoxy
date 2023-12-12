import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import {
    ButtonModule,
    CardModule,
    FormModule,
    GridModule,
    SharedModule,
} from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';
import {
    CommanderUsersClientService,
    ToastsService,
} from '@scrapoxy/frontend-sdk';
import { lastValueFrom } from 'rxjs';
import type { OnInit } from '@angular/core';
import type { IAuthService } from '@scrapoxy/common';


@Component({
    standalone: true,
    templateUrl: 'login.component.html',
    styleUrls: [
        './login.component.scss',
    ],
    imports: [
        ButtonModule,
        CardModule,
        FormModule,
        GridModule,
        IconModule,
        SharedModule,
        ReactiveFormsModule,
    ],
})
export class LoginComponent implements OnInit {
    auths: IAuthService[] = [];

    authLocal: boolean | undefined = void 0;

    form: FormGroup;

    constructor(
        private readonly commander: CommanderUsersClientService,
        fb: FormBuilder,
        private readonly client: HttpClient,
        private readonly toastsService: ToastsService
    ) {
        this.form = fb.group({
            username: [
                void 0, Validators.required,
            ],
            password: [
                void 0, Validators.required,
            ],
        });
    }

    async ngOnInit(): Promise<void> {
        try {
            this.auths = await this.commander.getAllAuths();

            const ind = this.auths.findIndex((a) => a.type === 'local');

            if (ind >= 0) {
                this.auths.splice(
                    ind,
                    1
                );

                this.authLocal = true;
            } else {
                this.authLocal = false;
            }
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Login',
                err.message
            );
        }
    }

    getAuthUrl(auth: IAuthService): string {
        return this.commander.getAuthUrl(auth);
    }

    async login() {
        const payload = this.form.value;

        await lastValueFrom(this.client.post(
            '/api/users/auths/local',
            payload
        ));

        window.location.href = '/';
    }
}
