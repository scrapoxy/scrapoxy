import {
    Component,
    Input,
} from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    Validators,
} from '@angular/forms';
import { CONNECTOR_IPROYAL_RESIDENTIAL_TYPE } from '@scrapoxy/common';
import { convertCodesToCountries } from '@scrapoxy/frontend-sdk';
import { ValidatorLifetime } from './input-lifetime/input-lifetime.component';
import type { OnInit } from '@angular/core';
import type { IConnectorComponent } from '@scrapoxy/frontend-sdk';


const IPROYAL_RESIDENTIAL_REGIONS = [
    'ad',
    'ae',
    'af',
    'ag',
    'ai',
    'al',
    'am',
    'ao',
    'ar',
    'at',
    'au',
    'aw',
    'az',
    'ba',
    'bb',
    'bd',
    'be',
    'bf',
    'bg',
    'bh',
    'bi',
    'bj',
    'bm',
    'bn',
    'bo',
    'br',
    'bs',
    'bt',
    'bw',
    'by',
    'bz',
    'ca',
    'cd',
    'cg',
    'ch',
    'ci',
    'cl',
    'cm',
    'cn',
    'co',
    'courir',
    'cr',
    'cu',
    'cv',
    'cw',
    'cy',
    'cz',
    'de',
    'dk',
    'dm',
    'do',
    'dz',
    'ec',
    'ee',
    'eg',
    'es',
    'et',
    'fi',
    'fj',
    'fr',
    'ga',
    'gb',
    'gd',
    'ge',
    'gf',
    'gg',
    'gh',
    'gi',
    'gm',
    'gp',
    'gr',
    'gt',
    'gu',
    'gy',
    'hk',
    'hn',
    'hr',
    'ht',
    'hu',
    'id',
    'ie',
    'il',
    'im',
    'in',
    'iq',
    'ir',
    'is',
    'it',
    'je',
    'jm',
    'jo',
    'jp',
    'ke',
    'kg',
    'kh',
    'kn',
    'kr',
    'kw',
    'ky',
    'kz',
    'la',
    'lb',
    'lc',
    'lk',
    'lr',
    'ls',
    'lt',
    'lu',
    'lv',
    'ly',
    'ma',
    'mc',
    'md',
    'me',
    'mf',
    'mg',
    'mk',
    'ml',
    'mm',
    'mn',
    'mo',
    'mq',
    'mr',
    'mt',
    'mu',
    'mv',
    'mw',
    'mx',
    'my',
    'mz',
    'na',
    'nc',
    'ng',
    'ni',
    'nl',
    'no',
    'np',
    'nz',
    'om',
    'pa',
    'pe',
    'pg',
    'ph',
    'pk',
    'pl',
    'pr',
    'ps',
    'pt',
    'py',
    'qa',
    're',
    'ro',
    'rs',
    'ru',
    'rw',
    'sa',
    'sc',
    'sd',
    'se',
    'sg',
    'si',
    'sk',
    'sl',
    'sm',
    'sn',
    'so',
    'sr',
    'ss',
    'sv',
    'sx',
    'sy',
    'sz',
    'tc',
    'tg',
    'th',
    'tj',
    'tm',
    'tn',
    'tr',
    'tt',
    'tw',
    'tz',
    'ua',
    'ug',
    'us',
    'uy',
    'uz',
    'vc',
    've',
    'vg',
    'vi',
    'vn',
    'ye',
    'za',
    'zm',
    'zw',
];


@Component({
    selector: `connector-${CONNECTOR_IPROYAL_RESIDENTIAL_TYPE}`,
    templateUrl: 'connector.component.html',
})
export class ConnectorIproyalResidentialComponent implements IConnectorComponent, OnInit {
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

    readonly countries = convertCodesToCountries(IPROYAL_RESIDENTIAL_REGIONS);

    readonly subForm: FormGroup;

    constructor(fb: FormBuilder) {
        this.subForm = fb.group({
            lifetime: [
                void 0,
                [
                    Validators.required, ValidatorLifetime,
                ],
            ],
            country: [
                void 0, Validators.required,
            ],
            highEndPool: [
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
                lifetime: '24h',
                country: 'all',
                highEndPool: false,
            });
        }
    }
}
