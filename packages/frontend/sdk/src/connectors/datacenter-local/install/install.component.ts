import {
    Component,
    Input,
} from '@angular/core';
import {
    FormBuilder,
    FormGroup,
} from '@angular/forms';
import { CONNECTOR_DATACENTER_LOCAL_TYPE } from '@scrapoxy/common';
import type { IInstallComponent } from '../../providers.interface';
import type { OnInit } from '@angular/core';


@Component({
    selector: `install-${CONNECTOR_DATACENTER_LOCAL_TYPE}`,
    template: '',
})
export class InstallDatacenterLocalComponent implements IInstallComponent, OnInit {
    @Input()
        form: FormGroup;

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

        // Nothing to patch
        //this.subForm.patchValue({});
    }
}
