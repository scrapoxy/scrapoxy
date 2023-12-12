import {
    Component,
    Input,
} from '@angular/core';
import { EProxyStatus } from '@scrapoxy/common';


@Component({
    selector: 'proxy-status',
    templateUrl: 'status.component.html',
})
export class ProxyStatusComponent {
    @Input()
    status: EProxyStatus;

    EProxyStatus = EProxyStatus;
}
