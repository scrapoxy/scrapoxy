import {
    Component,
    Input,
} from '@angular/core';
import { EProxyStatus } from '@scrapoxy/common';
import type { IFingerprint } from '@scrapoxy/common';


enum EFingerprintStatus {
    ONLINE = 'online',
    OFFLINE = 'offline',
    ERROR = 'error',
}


@Component({
    selector: 'fingerprint-status',
    templateUrl: 'status.component.html',
})
export class FingerprintStatusComponent {
    @Input()
    fingerprint: IFingerprint | null;

    @Input()
    error: string | null;

    get status(): EFingerprintStatus {
        if (this.error) {
            return EFingerprintStatus.ERROR;
        }

        if (this.fingerprint) {
            return EFingerprintStatus.ONLINE;
        }

        return EFingerprintStatus.OFFLINE;
    }

    protected readonly EProxyStatus = EProxyStatus;

    protected readonly EFingerprintStatus = EFingerprintStatus;
}
