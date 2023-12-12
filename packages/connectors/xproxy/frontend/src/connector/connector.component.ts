import {
    Component,
    Input,
} from '@angular/core';
import {
    FormBuilder,
    FormGroup,
} from '@angular/forms';
import { CONNECTOR_XPROXY_TYPE } from '@scrapoxy/connector-xproxy-sdk';
import type { OnInit } from '@angular/core';
import type { IConnectorComponent } from '@scrapoxy/frontend-sdk';


@Component({
    selector: `connector-${CONNECTOR_XPROXY_TYPE}`,
    template: '<div></div>',
})
export class ConnectorXProxyComponent implements IConnectorComponent, OnInit {
    @Input()
    form: FormGroup;

    @Input()
    projectId: string;

    @Input()
    connectorId: string | undefined;

    @Input()
    credentialId: string;

    @Input()
    createMode: boolean;

    readonly subForm: FormGroup;

    constructor(fb: FormBuilder) {
        this.subForm = fb.group({});
    }

    async ngOnInit(): Promise<void> {
        if (this.form.get('config')) {
            this.form.removeControl('config');
        }

        this.form.addControl(
            'config',
            this.subForm
        );
    }
}
