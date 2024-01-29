import {
    Component,
    Input,
} from '@angular/core';
import {
    FormBuilder,
    FormGroup,
} from '@angular/forms';
import { CONNECTOR_FREEPROXIES_TYPE } from '@scrapoxy/common';
import type { ICredentialComponent } from '../../providers.interface';
import type { OnInit } from '@angular/core';


@Component({
    selector: `credential-${CONNECTOR_FREEPROXIES_TYPE}`,
    template: '<div></div>',
})
export class CredentialFreeproxiesComponent implements ICredentialComponent, OnInit {
    @Input()
    form: FormGroup;

    @Input()
    projectId: string;

    @Input()
    credentialId: string | undefined;

    @Input()
    createMode: boolean;

    readonly subForm: FormGroup;

    constructor(fb: FormBuilder) {
        this.subForm = fb.group({});
    }

    async ngOnInit(): Promise<void> {
        await Promise.resolve();

        if (this.form.get('config')) {
            this.form.removeControl('config');
        }

        this.form.addControl(
            'config',
            this.subForm
        );
    }
}
