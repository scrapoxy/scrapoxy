import {
    Component,
    Input,
} from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    Validators,
} from '@angular/forms';
import { CONNECTOR_GCP_TYPE } from '@scrapoxy/connector-gcp-sdk';
import type { OnInit } from '@angular/core';
import type { ICredentialComponent } from '@scrapoxy/frontend-sdk';


@Component({
    selector: `credential-${CONNECTOR_GCP_TYPE}`,
    templateUrl: 'credential.component.html',
})
export class CredentialGcpComponent implements ICredentialComponent, OnInit {
    @Input()
        form: FormGroup;

    @Input()
    projectId: string;

    @Input()
    credentialId: string | undefined;

    @Input()
        createMode: boolean;

    readonly subForm: FormGroup;

    constructor(fb: FormBuilder) {
        this.subForm = fb.group({
            projectId: [
                void 0, Validators.required,
            ],
            clientEmail: [
                void 0, Validators.required,
            ],
            privateKeyId: [
                void 0, Validators.required,
            ],
            privateKey: [
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

        if (this.createMode) {
            await this.pasteCredentials();
        }
    }

    async pasteCredentials() {
        const dataRaw = await navigator.clipboard.readText();
        try {
            const data = JSON.parse(dataRaw);

            if (data.project_id && data.project_id.length > 0) {
                this.subForm.patchValue({
                    projectId: data.project_id,
                });
            }

            if (data.client_email && data.client_email.length > 0) {
                this.subForm.patchValue({
                    clientEmail: data.client_email,
                });
            }

            if (data.private_key_id && data.private_key_id.length > 0) {
                this.subForm.patchValue({
                    privateKeyId: data.private_key_id,
                });
            }

            if (data.private_key && data.private_key.length > 0) {
                this.subForm.patchValue({
                    privateKey: data.private_key,
                });
            }
        } catch (err: any) {
            // Ignore
        }
    }
}
