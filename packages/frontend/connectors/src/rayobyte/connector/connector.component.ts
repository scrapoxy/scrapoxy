import {
    Component,
    Inject,
    Input,
} from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    Validators,
} from '@angular/forms';
import {
    CONNECTOR_RAYOBYTE_TYPE,
    ERayobyteQueryCredential,
} from '@scrapoxy/common';
import {
    CommanderFrontendClientService,
    ToastsService,
} from '@scrapoxy/frontend-sdk';
import type { OnInit } from '@angular/core';
import type { ICommanderFrontendClient } from '@scrapoxy/common';
import type { IConnectorComponent } from '@scrapoxy/frontend-sdk';


@Component({
    selector: `connector-${CONNECTOR_RAYOBYTE_TYPE}`,
    templateUrl: 'connector.component.html',
})
export class ConnectorRayobyteComponent implements IConnectorComponent, OnInit {
    @Input()
        form: FormGroup;

    @Input()
        projectId: string;

    @Input()
        credentialId: string;

    @Input()
    connectorId: string | undefined;

    @Input()
        createMode: boolean;

    packages: string[] = [];

    processingPackages = false;

    readonly subForm: FormGroup;

    constructor(
        @Inject(CommanderFrontendClientService)
        private readonly commander: ICommanderFrontendClient,
        fb: FormBuilder,
        private readonly toastsService: ToastsService
    ) {
        this.subForm = fb.group({
            packageFilter: [
                void 0, Validators.required,
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

        if (this.createMode) {
            this.subForm.patchValue({
                packageFilter: 'all',
            });
        }

        this.processingPackages = true;

        try {
            this.packages = await this.commander.queryCredential(
                this.projectId,
                this.credentialId,
                {
                    type: ERayobyteQueryCredential.Packages,
                }
            )
                .then((packages) => packages.sort());
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Connector AWS',
                err.message
            );
        } finally {
            this.processingPackages = false;
        }
    }
}
