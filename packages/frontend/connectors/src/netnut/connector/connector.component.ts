import {
    Component,
    Input,
} from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    Validators,
} from '@angular/forms';
import { CONNECTOR_NETNUT_TYPE } from '@scrapoxy/common';
import { convertCodesToCountries } from '@scrapoxy/frontend-sdk';
import type { OnInit } from '@angular/core';
import type {
    IConnectorComponent,
    IIsocodeCountry,
} from '@scrapoxy/frontend-sdk';



@Component({
    selector: `connector-${CONNECTOR_NETNUT_TYPE}`,
    templateUrl: 'connector.component.html',
})
export class ConnectorNetnutComponent implements IConnectorComponent, OnInit {
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

    countries: IIsocodeCountry[];

    readonly subForm: FormGroup;

    constructor(fb: FormBuilder) {
        this.subForm = fb.group({
            proxyType: [
                void 0, Validators.required,
            ],
            country: [
                void 0, Validators.required,
            ],
        });

        this.countries = convertCodesToCountries([
            'AE',
            'AG',
            'AI',
            'AL',
            'AO',
            'AR',
            'AT',
            'AU',
            'AZ',
            'BA',
            'BB',
            'BD',
            'BE',
            'BG',
            'BH',
            'BM',
            'BN',
            'BO',
            'BR',
            'BS',
            'BW',
            'BY',
            'BZ',
            'CA',
            'CH',
            'CL',
            'CN',
            'CO',
            'CR',
            'CW',
            'CY',
            'CZ',
            'DE',
            'DK',
            'DM',
            'DO',
            'DZ',
            'EC',
            'EG',
            'ES',
            'ET',
            'FJ',
            'FR',
            'GB',
            'GD',
            'GH',
            'GR',
            'GT',
            'GY',
            'HK',
            'HN',
            'HR',
            'HU',
            'ID',
            'IE',
            'IL',
            'IM',
            'IN',
            'IQ',
            'IR',
            'IS',
            'IT',
            'JE',
            'JM',
            'JO',
            'JP',
            'KE',
            'KG',
            'KH',
            'KN',
            'KR',
            'KW',
            'KY',
            'KZ',
            'LB',
            'LC',
            'LI',
            'LT',
            'LU',
            'LV',
            'MA',
            'MD',
            'MK',
            'MM',
            'MN',
            'MT',
            'MU',
            'MV',
            'MX',
            'MY',
            'NG',
            'NI',
            'NL',
            'NO',
            'NP',
            'NZ',
            'OM',
            'PA',
            'PE',
            'PG',
            'PH',
            'PK',
            'PL',
            'PR',
            'PS',
            'PT',
            'PY',
            'QA',
            'RO',
            'RS',
            'RU',
            'SA',
            'SE',
            'SG',
            'SI',
            'SN',
            'SR',
            'SV',
            'SX',
            'SY',
            'TC',
            'TH',
            'TN',
            'TR',
            'TT',
            'TW',
            'UA',
            'UG',
            'US',
            'UY',
            'UZ',
            'VC',
            'VE',
            'VG',
            'VI',
            'VN',
            'XK',
            'ZA',
            'ZM',
        ]);

        for (const country of this.countries) {
            country.code = country.code.toLowerCase();
        }
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
                proxyType: 'res',
                country: 'any',
            });
        }
    }
}
