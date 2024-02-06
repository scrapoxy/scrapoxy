import {
    Component,
    EventEmitter,
    Output,
} from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    Validators,
} from '@angular/forms';
import {

    ONE_DAY_IN_MS,
    ONE_SECOND_IN_MS,
} from '@scrapoxy/common';
import { ValidatorUrl } from '@scrapoxy/frontend-sdk';
import type { ISourceBase } from '@scrapoxy/common';


@Component({
    selector: 'source-add',
    templateUrl: './source-add.component.html',
})
export class SourceAddComponent {
    @Output() add = new EventEmitter<ISourceBase[]>();

    form: FormGroup;

    constructor(fb: FormBuilder) {
        this.form = fb.group({
            url: [
                '',
                [
                    Validators.required, ValidatorUrl,
                ],
            ],
            delay: [
                ONE_DAY_IN_MS,
                [
                    Validators.required, Validators.min(10 * ONE_SECOND_IN_MS),
                ],
            ],
        });
    }

    async create() {
        const source = this.form.value as ISourceBase;

        this.add.emit([
            source,
        ]);

        this.form.reset({
            url: '',
            delay: ONE_DAY_IN_MS,
        });

        this.form.markAsPristine();
    }
}
