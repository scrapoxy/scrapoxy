import {
    Component,
    Input,
    NgZone,
} from '@angular/core';


const POPUP_DELAY_IN_MS = 1000;


@Component({
    selector: 'connection',
    templateUrl: './connection.component.html',
    styleUrls: [
        './connection.component.scss',
    ],
})
export class ConnectionComponent {
    visible = false;

    timer: ReturnType<typeof setTimeout> | undefined = void 0;

    @Input()
    get disconnected(): boolean {
        return this.visible;
    }

    set disconnected(val: boolean) {
        if (this.visible !== val) {
            if (!this.timer) {
                this.timer = setTimeout(
                    () => {
                        this.ngZone.run(() => {
                            this.visible = val;
                        });

                        this.timer = void 0;
                    },
                    POPUP_DELAY_IN_MS
                );
            }
        } else {
            if (this.timer) {
                clearTimeout(this.timer);
                this.timer = void 0;
            }
        }
    }

    constructor(private readonly ngZone: NgZone) { }
}
