import {
    Component,
    HostBinding,
    Input,
} from '@angular/core';


@Component({
    selector: 'button[loading]',
    template: `
        @if (disabled) {
        <svg cIcon
             name="cilReload"
             class="spin"></svg>
        }
        <ng-content></ng-content>
    `,
})
export class LoadingButtonComponent {
    @Input()
    loading = false;

    @HostBinding('attr.disabled')
    get disabled(): boolean | undefined {
        return this.loading ? true : void 0;
    }

    set disabled(val: boolean | undefined) {
        this.loading = val ? true : false;
    }
}
