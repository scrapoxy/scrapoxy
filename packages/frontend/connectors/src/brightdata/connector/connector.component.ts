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
    EBrightdataQueryCredential,
} from '@scrapoxy/common';
import {
    CommanderFrontendClientService,
    ToastsService,
} from '@scrapoxy/frontend-sdk';
import type { OnInit } from '@angular/core';
import type { IBrightdataZoneView } from '@scrapoxy/backend-connectors';
import type { ICommanderFrontendClient } from '@scrapoxy/common';
import type { IConnectorComponent } from '@scrapoxy/frontend-sdk';


@Component({
    selector: `connector-${CONNECTOR_NIMBLEWAY_TYPE}`,
    templateUrl: 'connector.component.html',
})
export class ConnectorBrightdataComponent implements IConnectorComponent, OnInit {
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

    zones: IBrightdataZoneView[] = [];

    readonly subForm: FormGroup;

    processingZones = false;

    constructor(
        @Inject(CommanderFrontendClientService)
        private readonly commander: ICommanderFrontendClient,
        fb: FormBuilder,
        private readonly toastsService: ToastsService
    ) {
        this.subForm = fb.group({
            zone: [
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

        this.processingZones = true;

        try {
            this.zones = await this.commander.queryCredential(
                this.projectId,
                this.credentialId,
                {
                    type: EBrightdataQueryCredential.Zones,
                }
            )
                .then((zones: IBrightdataZoneView[]) => zones.sort((
                    a, b
                ) => a.name.localeCompare(b.name)));
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Connector Bright Data',
                err.message
            );
        } finally {
            this.processingZones = false;
        }
    }
}
