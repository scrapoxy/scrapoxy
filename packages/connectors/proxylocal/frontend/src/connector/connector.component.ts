import {
    Component,
    Input,
} from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    Validators,
} from '@angular/forms';
import { CONNECTOR_PROXYLOCAL_TYPE } from '@scrapoxy/connector-proxylocal-sdk';
import type { OnInit } from '@angular/core';
import type { IConnectorComponent } from '@scrapoxy/frontend-sdk';


@Component({
    selector: `connector-${CONNECTOR_PROXYLOCAL_TYPE}`,
    templateUrl: 'connector.component.html',
})
export class ConnectorProxylocalComponent implements IConnectorComponent, OnInit {
    @Input()
        form: FormGroup;

    @Input()
        projectId: string;

    @Input()
        credentialId: string;

    @Input()
    connectorId: string | undefined;

    @Input()
        createMode: boolean;

    readonly subForm: FormGroup;

    constructor(fb: FormBuilder) {
        this.subForm = fb.group({
            region: [
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
            this.subForm.patchValue({
                region: 'us',
            });
        }
    }
}
