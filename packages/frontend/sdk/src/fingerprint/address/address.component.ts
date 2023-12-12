import {
    Component,
    Input,
} from '@angular/core';
import type { IFingerprint } from '@scrapoxy/common';


@Component({
    selector: 'fingerprint-address',
    templateUrl: 'address.component.html',
    styleUrls: [
        'address.component.scss',
    ],
})
export class FingerprintAddressComponent {
    @Input()
    fingerprint: IFingerprint | null;

    get countryFlag(): string {
        if (!this.fingerprint?.countryCode
            || this.fingerprint.countryCode.length < 2
        ) {
            return 'cil-rectangle';
        }

        return `cif${this.fingerprint.countryCode[ 0 ].toUpperCase()}${this.fingerprint.countryCode.substring(1)
            .toLowerCase()}`;
    }
}
