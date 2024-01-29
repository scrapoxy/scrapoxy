import {
    Component,
    Input,
} from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    Validators,
} from '@angular/forms';
import { CONNECTOR_AZURE_TYPE } from '@scrapoxy/common';
import type { ICredentialComponent } from '../../providers.interface';
import type { OnInit } from '@angular/core';


@Component({
    selector: `credential-${CONNECTOR_AZURE_TYPE}`,
    templateUrl: 'credential.component.html',
})
export class CredentialAzureComponent implements ICredentialComponent, OnInit {
    @Input()
        form: FormGroup;

    @Input()
    projectId: string;

    @Input()
    credentialId: string | undefined;

    @Input()
        createMode: boolean;

    secretType = 'password';


    readonly subForm: FormGroup;

    constructor(fb: FormBuilder) {
        this.subForm = fb.group({
            tenantId: [
                void 0, Validators.required,
            ],
            clientId: [
                void 0, Validators.required,
            ],
            secret: [
                void 0, Validators.required,
            ],
            subscriptionId: [
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

    toggleSecretType() {
        if (this.secretType === 'password') {
            this.secretType = 'text';
        } else {
            this.secretType = 'password';
        }
    }
}
