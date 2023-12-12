import {
    Component,
    Input,
} from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    Validators,
} from '@angular/forms';
import { CONNECTOR_RAYOBYTE_TYPE } from '@scrapoxy/connector-rayobyte-sdk';
import type { OnInit } from '@angular/core';
import type { ICredentialComponent } from '@scrapoxy/frontend-sdk';


@Component({
    selector: `credential-${CONNECTOR_RAYOBYTE_TYPE}`,
    templateUrl: 'credential.component.html',

})
export class CredentialRayobyteComponent implements ICredentialComponent, OnInit {
    @Input()
    form: FormGroup;

    @Input()
    projectId: string;

    @Input()
    credentialId: string | undefined;

    @Input()
    createMode: boolean;

    readonly subForm: FormGroup;

    apiKeyType = 'password';

    constructor(fb: FormBuilder) {
        this.subForm = fb.group({
            email: [
                void 0,
                [
                    Validators.required, Validators.email,
                ],
            ],
            apiKey: [
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

    toggleApiKey() {
        if (this.apiKeyType === 'password') {
            this.apiKeyType = 'text';
        } else {
            this.apiKeyType = 'password';
        }
    }
}
