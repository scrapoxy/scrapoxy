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
    CONNECTOR_NIMBLEWAY_TYPE,
    ENimblewayQueryCredential,
} from '@scrapoxy/connector-nimbleway-sdk';
import {
    CommanderFrontendClientService,
    ToastsService,
} from '@scrapoxy/frontend-sdk';
import type { OnInit } from '@angular/core';
import type { ICommanderFrontendClient } from '@scrapoxy/common';
import type { INimblewayGeoItem } from '@scrapoxy/connector-nimbleway-sdk';
import type { IConnectorComponent } from '@scrapoxy/frontend-sdk';


@Component({
    selector: `connector-${CONNECTOR_NIMBLEWAY_TYPE}`,
    templateUrl: 'connector.component.html',
})
export class ConnectorNimblewayComponent implements IConnectorComponent, OnInit {
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

    countries: INimblewayGeoItem[] = [];

    readonly subForm: FormGroup;

    processingCountries = false;

    constructor(
        @Inject(CommanderFrontendClientService)
        private readonly commander: ICommanderFrontendClient,
        fb: FormBuilder,
        private readonly toastsService: ToastsService
    ) {
        this.subForm = fb.group({
            country: [
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
                country: 'all',
            });
        }

        this.processingCountries = true;

        try {
            this.countries = await this.commander.queryCredential(
                this.projectId,
                this.credentialId,
                {
                    type: ENimblewayQueryCredential.Countries,
                }
            )
                .then((countries: INimblewayGeoItem[]) => countries.sort((
                    a, b
                ) => a.name.localeCompare(b.name)));
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Connector Nimble',
                err.message
            );
        } finally {
            this.processingCountries = false;
        }
    }
}
