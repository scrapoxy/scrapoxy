import {
    Component,
    Inject,
    Input,
} from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    Validators,
} from '@angular/forms';
import {
    CONNECTOR_SMARTPROXY_TYPE,
    ESmartproxyCredentialType,
} from '@scrapoxy/common';
import {
    CommanderFrontendClientService,
    convertCodesToCountries,
    ToastsService,
} from '@scrapoxy/frontend-sdk';
import type { OnInit } from '@angular/core';
import type { ICommanderFrontendClient } from '@scrapoxy/common';
import type {
    IConnectorComponent,
    IIsocodeCountry,
} from '@scrapoxy/frontend-sdk';


@Component({
    selector: `connector-${CONNECTOR_SMARTPROXY_TYPE}`,
    templateUrl: 'connector.component.html',
})
export class ConnectorSmartproxyComponent implements IConnectorComponent, OnInit {
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

    countries: IIsocodeCountry[] = [];

    readonly subForm: FormGroup;

    private credentialType: ESmartproxyCredentialType | undefined;

    constructor(
        @Inject(CommanderFrontendClientService)
        private readonly commander: ICommanderFrontendClient,
        fb: FormBuilder,
        private readonly toastsService: ToastsService
    ) {
        this.subForm = fb.group({
            country: [
                void 0, Validators.required,
            ],
            sessionDuration: [
                void 0,
                [
                    Validators.required, Validators.min(1), Validators.max(1440),
                ],
            ],
        });
    }

    get hasSessionDuration(): boolean {
        return this.credentialType === ESmartproxyCredentialType.RESIDENTIAL;
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
                country: 'all',
                sessionDuration: 10,
            });
        }

        try {
            this.credentialType = await this.commander.getCredentialById(
                this.projectId,
                this.credentialId
            )
                .then(data => data.config.credentialType);

            switch (this.credentialType) {
                case ESmartproxyCredentialType.DC_DEDICATED: {
                    this.countries = convertCodesToCountries([
                        'IL',
                        'IT',
                        'NL',
                        'FR',
                        'DE',
                        'GB',
                        'AU',
                        'US',
                        'CA',
                        'IN',
                        'JP',
                    ]);

                    break;
                }

                case ESmartproxyCredentialType.ISP_DEDICATED: {
                    this.countries = convertCodesToCountries([
                        'US',
                    ]);
                    break;
                }

                case ESmartproxyCredentialType.ISP_SHARED: {
                    this.countries = convertCodesToCountries([
                        'US',
                        'FR',
                        'HK',
                        'CA',
                        'AU',
                        'IT',
                        'JP',
                        'NL',
                        'GB',
                    ]);
                    break;
                }

                case ESmartproxyCredentialType.RESIDENTIAL: {
                    this.countries = convertCodesToCountries([
                        'AD',
                        'AE',
                        'AF',
                        'AL',
                        'AM',
                        'AO',
                        'AR',
                        'AT',
                        'AU',
                        'AW',
                        'AZ',
                        'BA',
                        'BD',
                        'BE',
                        'BG',
                        'BH',
                        'BJ',
                        'BO',
                        'BR',
                        'BS',
                        'BT',
                        'BY',
                        'BZ',
                        'CA',
                        'CH',
                        'CI',
                        'CL',
                        'CM',
                        'CN',
                        'CO',
                        'CR',
                        'CU',
                        'CY',
                        'CZ',
                        'DE',
                        'DJ',
                        'DK',
                        'DM',
                        'EC',
                        'EE',
                        'EG',
                        'ES',
                        'ET',
                        'EU',
                        'FI',
                        'FJ',
                        'FR',
                        'GB',
                        'GE',
                        'GH',
                        'GM',
                        'GR',
                        'HK',
                        'HN',
                        'HR',
                        'HT',
                        'HU',
                        'ID',
                        'IE',
                        'IL',
                        'IN',
                        'IQ',
                        'IR',
                        'IS',
                        'IT',
                        'JM',
                        'JO',
                        'JP',
                        'KE',
                        'KH',
                        'KR',
                        'KZ',
                        'LB',
                        'LI',
                        'LR',
                        'LT',
                        'LU',
                        'LV',
                        'MA',
                        'MC',
                        'MD',
                        'ME',
                        'MG',
                        'MK',
                        'ML',
                        'MM',
                        'MN',
                        'MR',
                        'MT',
                        'MU',
                        'MV',
                        'MX',
                        'MY',
                        'MZ',
                        'NG',
                        'NL',
                        'NO',
                        'NZ',
                        'OM',
                        'PA',
                        'PE',
                        'PH',
                        'PK',
                        'PL',
                        'PR',
                        'PT',
                        'PY',
                        'QA',
                        'RO',
                        'RS',
                        'RU',
                        'SA',
                        'SC',
                        'SD',
                        'SE',
                        'SG',
                        'SI',
                        'SK',
                        'SN',
                        'SS',
                        'SY',
                        'TD',
                        'TG',
                        'TH',
                        'TM',
                        'TN',
                        'TR',
                        'TT',
                        'TW',
                        'UA',
                        'UG',
                        'US',
                        'UY',
                        'UZ',
                        'VG',
                        'VN',
                        'YE',
                        'ZA',
                        'ZM',
                        'ZW',
                    ]);
                    break;
                }

                default: {
                    this.countries = [];
                    break;
                }
            }

            for (const country of this.countries) {
                country.code = country.code.toLowerCase();
            }
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Connector Smartproxy',
                err.message
            );
        }
    }
}
