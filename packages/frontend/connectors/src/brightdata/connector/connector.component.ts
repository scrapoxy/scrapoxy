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
    CONNECTOR_BRIGHTDATA_TYPE,
    EBrightdataQueryCredential,
} from '@scrapoxy/common';
import {
    CommanderFrontendClientService,
    convertCodesToCountries,
    ToastsService,
} from '@scrapoxy/frontend-sdk';
import type { OnInit } from '@angular/core';
import type {
    IBrightdataZoneView,
    ICommanderFrontendClient,
    IIsocodeCountry,
} from '@scrapoxy/common';
import type { IConnectorComponent } from '@scrapoxy/frontend-sdk';


@Component({
    selector: `connector-${CONNECTOR_BRIGHTDATA_TYPE}`,
    templateUrl: 'connector.component.html',
})
export class ConnectorBrightdataComponent implements IConnectorComponent, OnInit {
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

    zones: IBrightdataZoneView[] = [];

    readonly subForm: FormGroup;

    processingZones = false;

    constructor(
        @Inject(CommanderFrontendClientService)
        private readonly commander: ICommanderFrontendClient,
        fb: FormBuilder,
        private readonly toastsService: ToastsService
    ) {
        this.subForm = fb.group({
            zoneName: [
                void 0, Validators.required,
            ],
            zoneType: [
                void 0, Validators.required,
            ],
            country: [
                void 0, Validators.required,
            ],
        });

        this.countries = convertCodesToCountries([
            'AE',
            'AL',
            'AM',
            'AR',
            'AT',
            'AU',
            'AZ',
            'BA',
            'BD',
            'BE',
            'BG',
            'BO',
            'BR',
            'BY',
            'CA',
            'CH',
            'CL',
            'CN',
            'CO',
            'CR',
            'CY',
            'CZ',
            'DE',
            'DK',
            'DO',
            'EC',
            'EE',
            'EG',
            'ES',
            'FI',
            'FR',
            'GB',
            'GE',
            'GH',
            'GR',
            'HK',
            'HR',
            'HU',
            'ID',
            'IE',
            'IL',
            'IM',
            'IN',
            'IQ',
            'IS',
            'IT',
            'JM',
            'JO',
            'JP',
            'KE',
            'KG',
            'KH',
            'KR',
            'KW',
            'KZ',
            'LA',
            'LK',
            'LT',
            'LU',
            'LV',
            'MA',
            'MD',
            'MK',
            'MM',
            'MX',
            'MY',
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
            'PT',
            'QA',
            'RO',
            'RS',
            'RU',
            'SA',
            'SE',
            'SG',
            'SI',
            'SK',
            'SL',
            'TH',
            'TJ',
            'TM',
            'TN',
            'TR',
            'TW',
            'TZ',
            'UA',
            'US',
            'UY',
            'UZ',
            'VN',
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
                country: 'all',
            });
        }

        this.processingZones = true;

        try {
            this.zones = await this.commander.queryCredential(
                this.projectId,
                this.credentialId,
                {
                    type: EBrightdataQueryCredential.Zones,
                }
            )
                .then((zones: IBrightdataZoneView[]) => zones.sort((
                    a, b
                ) => a.name.localeCompare(b.name)));
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Connector Bright Data',
                err.message
            );
        } finally {
            this.processingZones = false;
        }
    }

    async zoneNameChanged(): Promise<void> {
        const zoneName = this.subForm.value.zoneName;
        let zoneType: string | undefined;

        if (zoneName) {
            const zone = this.zones.find((z) => z.name === zoneName);
            zoneType = zone ? zone.type : void 0;
        } else {
            zoneType = void 0;
        }

        this.subForm.patchValue({
            zoneType,
        });
    }
}
