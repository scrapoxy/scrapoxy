import {
    Component,
    forwardRef,
    Input,
} from '@angular/core';
import { ToastComponent } from '@coreui/angular';


@Component({
    selector: 'toast-message',
    templateUrl: './message.component.html',
    styleUrls: [
        './message.component.scss',
    ],
    providers: [
        {
            provide: ToastComponent, useExisting: forwardRef(() => ToastMessageComponent),
        },
    ],
})
export class ToastMessageComponent extends ToastComponent {
    @Input() title = '';

    @Input() message = '';
}
