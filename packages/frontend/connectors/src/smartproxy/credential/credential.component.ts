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
    CONNECTOR_SMARTPROXY_TYPE,
    ESmartproxyCredentialType,
} from '@scrapoxy/common';
import type { OnInit } from '@angular/core';
import type { ICredentialComponent } from '@scrapoxy/frontend-sdk';


@Component({
    selector: `credential-${CONNECTOR_SMARTPROXY_TYPE}`,
    templateUrl: 'credential.component.html',

})
export class CredentialSmartproxyComponent implements ICredentialComponent, OnInit {
    @Input()
    form: FormGroup;

    @Input()
    projectId: string;

    @Input()
    credentialId: string | undefined;

    @Input()
    createMode: boolean;

    readonly ECredentialType = ESmartproxyCredentialType;

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
                credentialType: ESmartproxyCredentialType.ISP_SHARED,
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
