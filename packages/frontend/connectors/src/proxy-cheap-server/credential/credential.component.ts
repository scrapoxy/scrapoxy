import {
    Component,
    Input,
} from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    Validators,
} from '@angular/forms';
import { CONNECTOR_PROXY_CHEAP_SERVER_TYPE } from '@scrapoxy/common';
import type { OnInit } from '@angular/core';
import type { ICredentialComponent } from '@scrapoxy/frontend-sdk';


@Component({
    selector: `credential-${CONNECTOR_PROXY_CHEAP_SERVER_TYPE}`,
    templateUrl: 'credential.component.html',

})
export class CredentialProxyCheapServerComponent implements ICredentialComponent, OnInit {
    @Input()
    form: FormGroup;

    @Input()
    projectId: string;

    @Input()
    credentialId: string | undefined;

    @Input()
    createMode: boolean;

    readonly subForm: FormGroup;

    secretType = 'password';

    constructor(fb: FormBuilder) {
        this.subForm = fb.group({
            key: [
                void 0, Validators.required,
            ],
            secret: [
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

    toggleSecret() {
        if (this.secretType === 'password') {
            this.secretType = 'text';
        } else {
            this.secretType = 'password';
        }
    }
}
