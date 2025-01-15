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
    convertCodesToCountries,
    ESmartproxyCredentialType,
} from '@scrapoxy/common';
import {
    CommanderFrontendClientService,
    ToastsService,
} from '@scrapoxy/frontend-sdk';
import type { OnInit } from '@angular/core';
import type {
    ICommanderFrontendClient,
    IIsocodeCountry,
} from '@scrapoxy/common';
import type { IConnectorComponent } from '@scrapoxy/frontend-sdk';


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
                        'il',
                        'it',
                        'nl',
                        'fr',
                        'de',
                        'gb',
                        'au',
                        'us',
                        'ca',
                        'in',
                        'jp',
                    ]);

                    break;
                }

                case ESmartproxyCredentialType.DC_SHARED: {
                    this.countries = convertCodesToCountries([
                        'de',
                        'eu',
                        'nl',
                        'ro',
                        'us',
                        'uk',
                    ]);

                    break;
                }

                case ESmartproxyCredentialType.ISP_DEDICATED: {
                    this.countries = convertCodesToCountries([
                        'us',
                    ]);
                    break;
                }

                case ESmartproxyCredentialType.ISP_SHARED: {
                    this.countries = convertCodesToCountries([
                        'us',
                        'fr',
                        'hk',
                        'ca',
                        'au',
                        'it',
                        'jp',
                        'nl',
                        'gb',
                    ]);
                    break;
                }

                case ESmartproxyCredentialType.RESIDENTIAL: {
                    this.countries = convertCodesToCountries([
                        'ad',
                        'ae',
                        'af',
                        'al',
                        'am',
                        'ao',
                        'ar',
                        'at',
                        'au',
                        'aw',
                        'az',
                        'ba',
                        'bd',
                        'be',
                        'bg',
                        'bh',
                        'bj',
                        'bo',
                        'br',
                        'bs',
                        'bt',
                        'by',
                        'bz',
                        'ca',
                        'ch',
                        'ci',
                        'cl',
                        'cm',
                        'cn',
                        'co',
                        'cr',
                        'cu',
                        'cy',
                        'cz',
                        'de',
                        'dj',
                        'dk',
                        'dm',
                        'ec',
                        'ee',
                        'eg',
                        'es',
                        'et',
                        'eu',
                        'fi',
                        'fj',
                        'fr',
                        'gb',
                        'ge',
                        'gh',
                        'gm',
                        'gr',
                        'hk',
                        'hn',
                        'hr',
                        'ht',
                        'hu',
                        'id',
                        'ie',
                        'il',
                        'in',
                        'iq',
                        'ir',
                        'is',
                        'it',
                        'jm',
                        'jo',
                        'jp',
                        'ke',
                        'kh',
                        'kr',
                        'kz',
                        'lb',
                        'li',
                        'lr',
                        'lt',
                        'lu',
                        'lv',
                        'ma',
                        'mc',
                        'md',
                        'me',
                        'mg',
                        'mk',
                        'ml',
                        'mm',
                        'mn',
                        'mr',
                        'mt',
                        'mu',
                        'mv',
                        'mx',
                        'my',
                        'mz',
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
                        'pr',
                        'pt',
                        'py',
                        'qa',
                        'ro',
                        'rs',
                        'ru',
                        'sa',
                        'sc',
                        'sd',
                        'se',
                        'sg',
                        'si',
                        'sk',
                        'sn',
                        'ss',
                        'sy',
                        'td',
                        'tg',
                        'th',
                        'tm',
                        'tn',
                        'tr',
                        'tt',
                        'tw',
                        'ua',
                        'ug',
                        'us',
                        'uy',
                        'uz',
                        'vg',
                        'vn',
                        'ye',
                        'za',
                        'zm',
                        'zw',
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
