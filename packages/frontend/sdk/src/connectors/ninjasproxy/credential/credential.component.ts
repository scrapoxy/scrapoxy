import {
    Component,
    Input,
} from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    Validators,
} from '@angular/forms';
import { CONNECTOR_NINJASPROXY_TYPE } from '@scrapoxy/common';
import type { ICredentialComponent } from '../../providers.interface';
import type { OnInit } from '@angular/core';
import type { InputType } from '@coreui/angular';


@Component({
    selector: `credential-${CONNECTOR_NINJASPROXY_TYPE}`,
    templateUrl: 'credential.component.html',

})
export class CredentialNinjasproxyComponent implements ICredentialComponent, OnInit {
    @Input()
    form: FormGroup;

    @Input()
    projectId: string;

    @Input()
    credentialId: string | undefined;

    @Input()
    createMode: boolean;

    readonly subForm: FormGroup;

    apiKeyType: Omit<InputType, 'checkbox' | 'radio'> = 'password';

    constructor(fb: FormBuilder) {
        this.subForm = fb.group({
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
