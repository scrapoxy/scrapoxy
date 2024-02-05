import {
    Component,
    Input,
} from '@angular/core';
import {
    FormBuilder,
    FormGroup,
} from '@angular/forms';
import { CONNECTOR_AZURE_TYPE } from '@scrapoxy/common';
import type { OnInit } from '@angular/core';
import type { IInstallComponent } from '@scrapoxy/frontend-sdk';


@Component({
    selector: `install-${CONNECTOR_AZURE_TYPE}`,
    templateUrl: 'install.component.html',
})
export class InstallAzureComponent implements IInstallComponent, OnInit {
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
