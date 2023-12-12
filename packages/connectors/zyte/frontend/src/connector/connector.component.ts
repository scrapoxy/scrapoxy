import {
    Component,
    Input,
} from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    Validators,
} from '@angular/forms';
import { CONNECTOR_ZYTE_TYPE } from '@scrapoxy/connector-zyte-sdk';
import { convertCodesToCountries } from '@scrapoxy/frontend-sdk';
import type { OnInit } from '@angular/core';
import type { IConnectorComponent } from '@scrapoxy/frontend-sdk';


const ZYTE_REGIONS = [
    'ae',
    'at',
    'au',
    'be',
    'br',
    'by',
    'ca',
    'ch',
    'cl',
    'cn',
    'de',
    'dk',
    'es',
    'fi',
    'fr',
    'gb',
    'gr',
    'hk',
    'id',
    'ie',
    'il',
    'in',
    'it',
    'jp',
    'kr',
    'mx',
    'my',
    'ng',
    'nl',
    'ph',
    'pl',
    'pt',
    'ro',
    'ru',
    'se',
    'sg',
    'th',
    'tr',
    'tw',
    'us',
    'za',
];


@Component({
    selector: `connector-${CONNECTOR_ZYTE_TYPE}`,
    templateUrl: 'connector.component.html',
})
export class ConnectorZyteComponent implements IConnectorComponent, OnInit {
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

    countries = convertCodesToCountries(ZYTE_REGIONS);

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
                region: 'US',
            });
        }
    }
}
