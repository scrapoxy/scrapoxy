import {
    Component,
    Input,
} from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    Validators,
} from '@angular/forms';
import {
    CONNECTOR_DECODO_TYPE,
    EDecodoCredentialType,
} from '@scrapoxy/common';
import type { OnInit } from '@angular/core';
import type { ICredentialComponent } from '@scrapoxy/frontend-sdk';


@Component({
    selector: `credential-${CONNECTOR_DECODO_TYPE}`,
    templateUrl: 'credential.component.html',

})
export class CredentialDecodoComponent implements ICredentialComponent, OnInit {
    @Input()
    form: FormGroup;

    @Input()
    projectId: string;

    @Input()
    credentialId: string | undefined;

    @Input()
    createMode: boolean;

    readonly ECredentialType = EDecodoCredentialType;

    readonly subForm: FormGroup;

    passwordType = 'password';

    constructor(fb: FormBuilder) {
        this.subForm = fb.group({
            credentialType: [
                void 0, Validators.required,
            ],
            username: [
                void 0, Validators.required,
            ],
            password: [
                void 0, Validators.required,
            ],
        });
    }

    async ngOnInit(): Promise<void> {
        await Promise.resolve();

        if (this.form!.get('config')) {
            this.form!.removeControl('config');
        }

        this.form!.addControl(
            'config',
            this.subForm
        );

        if (this.createMode) {
            this.subForm.patchValue({
                credentialType: EDecodoCredentialType.ISP_SHARED,
            });
        }
    }

    togglePassword() {
        if (this.passwordType === 'password') {
            this.passwordType = 'text';
        } else {
            this.passwordType = 'password';
        }
    }
}
