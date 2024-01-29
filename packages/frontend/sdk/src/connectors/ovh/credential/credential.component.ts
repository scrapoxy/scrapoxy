import {
    Component,
    Input,
} from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    Validators,
} from '@angular/forms';
import { CONNECTOR_OVH_TYPE } from '@scrapoxy/common';
import type { ICredentialComponent } from '../../providers.interface';
import type { OnInit } from '@angular/core';


@Component({
    selector: `credential-${CONNECTOR_OVH_TYPE}`,
    templateUrl: 'credential.component.html',
})
export class CredentialOvhComponent implements ICredentialComponent, OnInit {
    @Input()
        form: FormGroup;

    @Input()
    projectId: string;

    @Input()
    credentialId: string | undefined;

    @Input()
        createMode: boolean;

    readonly subForm: FormGroup;

    appSecretType = 'password';

    constructor(fb: FormBuilder) {
        this.subForm = fb.group({
            appKey: [
                void 0, Validators.required,
            ],
            appSecret: [
                void 0, Validators.required,
            ],
            consumerKey: [
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

    toggleAppSecretType() {
        if (this.appSecretType === 'password') {
            this.appSecretType = 'text';
        } else {
            this.appSecretType = 'password';
        }
    }
}
