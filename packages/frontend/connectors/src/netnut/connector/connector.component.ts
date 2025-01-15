import {
    Component,
    Input,
} from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    Validators,
} from '@angular/forms';
import {
    CONNECTOR_NETNUT_TYPE,
    convertCodesToCountries,
} from '@scrapoxy/common';
import type { OnInit } from '@angular/core';
import type { IIsocodeCountry } from '@scrapoxy/common';
import type { IConnectorComponent } from '@scrapoxy/frontend-sdk';



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
            'ae',
            'ag',
            'ai',
            'al',
            'ao',
            'ar',
            'at',
            'au',
            'az',
            'ba',
            'bb',
            'bd',
            'be',
            'bg',
            'bh',
            'bm',
            'bn',
            'bo',
            'br',
            'bs',
            'bw',
            'by',
            'bz',
            'ca',
            'ch',
            'cl',
            'cn',
            'co',
            'cr',
            'cw',
            'cy',
            'cz',
            'de',
            'dk',
            'dm',
            'do',
            'dz',
            'ec',
            'eg',
            'es',
            'et',
            'fj',
            'fr',
            'gb',
            'gd',
            'gh',
            'gr',
            'gt',
            'gy',
            'hk',
            'hn',
            'hr',
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
            'lb',
            'lc',
            'li',
            'lt',
            'lu',
            'lv',
            'ma',
            'md',
            'mk',
            'mm',
            'mn',
            'mt',
            'mu',
            'mv',
            'mx',
            'my',
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
            'ro',
            'rs',
            'ru',
            'sa',
            'se',
            'sg',
            'si',
            'sn',
            'sr',
            'sv',
            'sx',
            'sy',
            'tc',
            'th',
            'tn',
            'tr',
            'tt',
            'tw',
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
            'xk',
            'za',
            'zm',
        ]);
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
                country: 'all',
            });
        }
    }
}
