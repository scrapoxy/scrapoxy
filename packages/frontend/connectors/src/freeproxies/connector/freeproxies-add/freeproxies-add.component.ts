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
import { parseFreeproxy } from '@scrapoxy/common';
import type { IFreeproxyBase } from '@scrapoxy/common';


@Component({
    selector: 'freeproxies-add',
    templateUrl: './freeproxies-add.component.html',
})
export class FreeproxiesAddComponent {
    @Output() add = new EventEmitter<IFreeproxyBase[]>();

    form: FormGroup;

    constructor(fb: FormBuilder) {
        this.form = fb.group({
            list: [
                '',
                [
                    Validators.required,
                ],
            ],
        });
    }

    async create() {
        const list = this.form.value.list as string;
        const freeproxies = list.split(/[\n,]/)
            .map(l => l.trim())
            .map(parseFreeproxy)
            .filter(p => !!p) as IFreeproxyBase[];

        this.add.emit(freeproxies);

        this.form.reset({
            list: '',
        });

        this.form.markAsPristine();
    }
}
