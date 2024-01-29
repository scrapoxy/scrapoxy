import {
    Component,
    Input,
} from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    Validators,
} from '@angular/forms';
import { CONNECTOR_GCP_TYPE } from '@scrapoxy/common';
import type { IInstallComponent } from '../../providers.interface';
import type { OnInit } from '@angular/core';


@Component({
    selector: `install-${CONNECTOR_GCP_TYPE}`,
    templateUrl: 'install.component.html',
})
export class InstallGcpComponent implements IInstallComponent, OnInit {
    @Input()
        form: FormGroup;

    readonly subForm: FormGroup;

    constructor(fb: FormBuilder) {
        this.subForm = fb.group({
            diskType: [
                void 0, Validators.required,
            ],
            diskSize: [
                void 0,
                [
                    Validators.required, Validators.min(1), Validators.max(128),
                ],
            ],
        });
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

        this.subForm.patchValue({
            diskType: 'pd-standard',
            diskSize: 10,
        });
    }
}
