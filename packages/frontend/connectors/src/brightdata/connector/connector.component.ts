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
    convertCodesToCountries,
    EBrightdataProductType,
    EBrightdataQueryCredential,
} from '@scrapoxy/common';
import {
    CommanderFrontendClientService,
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
            'ae',
            'al',
            'am',
            'ar',
            'at',
            'au',
            'az',
            'ba',
            'bd',
            'be',
            'bg',
            'bo',
            'br',
            'by',
            'ca',
            'ch',
            'cl',
            'cn',
            'co',
            'cr',
            'cy',
            'cz',
            'de',
            'dk',
            'do',
            'ec',
            'ee',
            'eg',
            'es',
            'fi',
            'fr',
            'gb',
            'ge',
            'gh',
            'gr',
            'hk',
            'hr',
            'hu',
            'id',
            'ie',
            'il',
            'im',
            'in',
            'iq',
            'is',
            'it',
            'jm',
            'jo',
            'jp',
            'ke',
            'kg',
            'kh',
            'kr',
            'kw',
            'kz',
            'la',
            'lk',
            'lt',
            'lu',
            'lv',
            'ma',
            'md',
            'mk',
            'mm',
            'mx',
            'my',
            'ng',
            'nl',
            'no',
            'nz',
            'om',
            'pa',
            'pe',
            'ph',
            'pk',
            'pl',
            'pt',
            'qa',
            'ro',
            'rs',
            'ru',
            'sa',
            'se',
            'sg',
            'si',
            'sk',
            'sl',
            'th',
            'tj',
            'tm',
            'tn',
            'tr',
            'tw',
            'tz',
            'ua',
            'us',
            'uy',
            'uz',
            'vn',
            'za',
            'zm',
        ]);
    }

    get countryEnabled(): boolean {
        return [
            EBrightdataProductType.MOBILE, EBrightdataProductType.RESIDENTIAL,
        ].includes(this.subForm.value.zoneType);
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

        if (!this.countryEnabled) {
            this.subForm.patchValue({
                country: 'all',
            });
        }
    }
}
