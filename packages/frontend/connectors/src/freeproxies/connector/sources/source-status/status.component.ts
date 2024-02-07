import {
    Component,
    Input,
} from '@angular/core';
import type { ISource } from '@scrapoxy/common';


@Component({
    selector: 'source-status',
    templateUrl: 'status.component.html',
    styleUrls: [
        './status.component.scss',
    ],
})
export class SourceStatusComponent {
    @Input()
    source: ISource;
}
