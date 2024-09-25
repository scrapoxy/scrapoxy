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
    CONNECTOR_ZYTE_TYPE,
    EZyteCredentialType,
} from '@scrapoxy/common';
import type { OnInit } from '@angular/core';
import type { ICredentialComponent } from '@scrapoxy/frontend-sdk';


@Component({
    selector: `credential-${CONNECTOR_ZYTE_TYPE}`,
    templateUrl: 'credential.component.html',

})
export class CredentialZyteComponent implements ICredentialComponent, OnInit {
    @Input()
        form: FormGroup;

    @Input()
    projectId: string;

    @Input()
    credentialId: string | undefined;

    @Input()
        createMode: boolean;

    readonly ECredentialType = EZyteCredentialType;

    readonly subForm: FormGroup;

    tokenType = 'password';

    constructor(fb: FormBuilder) {
        this.subForm = fb.group({
            credentialType: [
                void 0, Validators.required,
            ],
            token: [
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
                credentialType: EZyteCredentialType.ZYTE_API,
            });
        }
    }

    toggleTokenType() {
        if (this.tokenType === 'password') {
            this.tokenType = 'text';
        } else {
            this.tokenType = 'password';
        }
    }
}
