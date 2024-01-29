import {
    Component,
    Input,
} from '@angular/core';
import {
    FormBuilder,
    FormGroup,
} from '@angular/forms';
import { CONNECTOR_NINJASPROXY_TYPE } from '@scrapoxy/common';
import type { IConnectorComponent } from '../../providers.interface';
import type { OnInit } from '@angular/core';


@Component({
    selector: `connector-${CONNECTOR_NINJASPROXY_TYPE}`,
    template: '<div></div>',
})
export class ConnectorNinjasproxyComponent implements IConnectorComponent, OnInit {
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
        await Promise.resolve();

        if (this.form.get('config')) {
            this.form.removeControl('config');
        }

        this.form.addControl(
            'config',
            this.subForm
        );
    }
}
