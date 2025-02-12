import {
    Component,
    Input,
} from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    Validators,
} from '@angular/forms';
import { CONNECTOR_TENCENT_TYPE } from '@scrapoxy/common';
import type { OnInit } from '@angular/core';
import type { ICredentialComponent } from '@scrapoxy/frontend-sdk';


@Component({
    selector: `credential-${CONNECTOR_TENCENT_TYPE}`,
    templateUrl: 'credential.component.html',
})
export class CredentialTencentComponent implements ICredentialComponent, OnInit {
    @Input()
    form: FormGroup;

    @Input()
    projectId: string;

    @Input()
    credentialId: string | undefined;

    @Input()
    createMode: boolean;

    secretKeyType = 'password';

    readonly subForm: FormGroup;

    constructor(fb: FormBuilder) {
        this.subForm = fb.group({
            secretId: [
                void 0, Validators.required,
            ],
            secretKey: [
                void 0, Validators.required,
            ],
        });
    }

    async ngOnInit(): Promise<void> {
        await Promise.resolve();

        if (this.form.get('config')) {
            this.form.removeControl('config');
        }

        this.form.addControl(
            'config',
            this.subForm
        );
    }

    toggleSecretKeyType() {
        if (this.secretKeyType === 'password') {
            this.secretKeyType = 'text';
        } else {
            this.secretKeyType = 'password';
        }
    }
}
