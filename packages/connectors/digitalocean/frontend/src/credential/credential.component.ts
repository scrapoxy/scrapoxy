import {
    Component,
    Input,
} from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    Validators,
} from '@angular/forms';
import { CONNECTOR_DIGITALOCEAN_TYPE } from '@scrapoxy/connector-digitalocean-sdk';
import type { OnInit } from '@angular/core';
import type { ICredentialComponent } from '@scrapoxy/frontend-sdk';


@Component({
    selector: `credential-${CONNECTOR_DIGITALOCEAN_TYPE}`,
    templateUrl: 'credential.component.html',

})
export class CredentialDigitaloceanComponent implements ICredentialComponent, OnInit {
    @Input()
        form: FormGroup;

    @Input()
    projectId: string;

    @Input()
    credentialId: string | undefined;

    @Input()
        createMode: boolean;

    readonly subForm: FormGroup;

    tokenType = 'password';

    constructor(fb: FormBuilder) {
        this.subForm = fb.group({
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
    }

    toggleTokenType() {
        if (this.tokenType === 'password') {
            this.tokenType = 'text';
        } else {
            this.tokenType = 'password';
        }
    }

    /*
    auth() {
        if (
            !this.projectId ||
            !this.form?.value.name
        ) {
            throw new Error('projectId not initialized');
        }

        // Save form
        const credentialToCreate: ICredentialToCreateCallback = {
            projectId: this.projectId,
            name: this.form.value.name,
            type: CONNECTOR_DIGITALOCEAN_TYPE,
            config: void 0,
        };
        const raw = JSON.stringify(credentialToCreate);
        window.localStorage.setItem(
            'credential::create',
            raw
        );

        // Redirect to DO
        const clientId = 'CLIENT_ID';
        const redirectUri = 'REDIRECT_URI';
        const params = [
            `client_id=${clientId}`,
            `redirect_uri=${redirectUri}`,
            'response_type=code',
            'scope=read write',
        ];
        window.location.href = `https://cloud.digitalocean.com/v1/oauth/authorize?${params.join('&')}`;
    }
     */
}
