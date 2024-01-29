import {
    Component,
    Input,
} from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    Validators,
} from '@angular/forms';
import { CONNECTOR_PROXIDIZE_TYPE } from '@scrapoxy/common';
import { ValidatorUrl } from '../../../validators';
import type { ICredentialComponent } from '../../providers.interface';
import type { OnInit } from '@angular/core';
import type { InputType } from '@coreui/angular';


@Component({
    selector: `credential-${CONNECTOR_PROXIDIZE_TYPE}`,
    templateUrl: 'credential.component.html',

})
export class CredentialProxidizeComponent implements ICredentialComponent, OnInit {
    @Input()
    form: FormGroup;

    @Input()
    projectId: string;

    @Input()
    credentialId: string | undefined;

    @Input()
    createMode: boolean;

    readonly subForm: FormGroup;

    apiTokenType: Omit<InputType, 'checkbox' | 'radio'> = 'password';

    proxyPasswordType: Omit<InputType, 'checkbox' | 'radio'> = 'password';

    constructor(fb: FormBuilder) {
        this.subForm = fb.group({
            apiUrl: [
                void 0,
                [
                    Validators.required, ValidatorUrl,
                ],
            ],
            apiToken: [
                void 0, Validators.required,
            ],
            proxyHostname: [
                void 0, Validators.required,
            ],
            proxyUsername: [
                void 0, Validators.required,
            ],
            proxyPassword: [
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
    }

    toggleApiTokenType() {
        if (this.apiTokenType === 'password') {
            this.apiTokenType = 'text';
        } else {
            this.apiTokenType = 'password';
        }
    }

    toggleProxyPasswordType() {
        if (this.proxyPasswordType === 'password') {
            this.proxyPasswordType = 'text';
        } else {
            this.proxyPasswordType = 'password';
        }
    }

    apiUrlFocusOut() {
        const apiUrlValue = this.subForm.controls.apiUrl.value;

        if (!apiUrlValue || apiUrlValue.length <= 0) {
            return;
        }

        const proxyHostname = this.subForm.controls.proxyHostname;

        if (proxyHostname.value && proxyHostname.value.length > 0) {
            return;
        }

        try {
            const url = new URL(apiUrlValue);
            proxyHostname.setValue(url.hostname);
        } catch (err) {
            return;
        }
    }
}
