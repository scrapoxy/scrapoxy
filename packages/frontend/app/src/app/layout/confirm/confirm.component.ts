import {
    Component,
    Input,
} from '@angular/core';
import { ConfirmService } from '@scrapoxy/frontend-sdk';
import type { IConfirmComponent } from '@scrapoxy/frontend-sdk';


const NOT_DEFINED = '[not defined]';


@Component({
    selector: 'confirm',
    templateUrl: 'confirm.component.html',
})
export class ConfirmComponent implements IConfirmComponent {
    @Input()
   title = NOT_DEFINED;

    @Input()
    description = NOT_DEFINED;

    visible = false;

    private callback: ((accept: boolean) => void) | undefined = void 0;

    constructor(confirmService: ConfirmService) {
        confirmService.register(this);
    }

    validate(accept: boolean) {
        if (this.callback) {
            this.callback(accept);
        }
    }

    visibleChange(visible: boolean) {
        if (this.visible === visible) {
            return;
        }

        this.visible = false;

        if (!this.visible) {
            if (this.callback) {
                this.callback(false);
            }
        }
    }

    confirm(
        title: string, description: string
    ): Promise<boolean> {
        this.title = title;
        this.description = description;

        return new Promise<boolean>((resolve) => {
            this.callback = (accept: boolean) => {
                this.callback = void 0;
                this.visible = false;

                resolve(accept);
            };

            this.visible = true;
        });
    }

}
