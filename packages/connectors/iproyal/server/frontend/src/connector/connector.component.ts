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
    CONNECTOR_IPROYAL_SERVER_TYPE,
    EIproyalServerQueryCredential,
} from '@scrapoxy/connector-iproyal-server-sdk';
import {
    CommanderFrontendClientService,
    ToastsService,
} from '@scrapoxy/frontend-sdk';
import type { OnInit } from '@angular/core';
import type { ICommanderFrontendClient } from '@scrapoxy/common';
import type { IConnectorComponent } from '@scrapoxy/frontend-sdk';


@Component({
    selector: `connector-${CONNECTOR_IPROYAL_SERVER_TYPE}`,
    templateUrl: 'connector.component.html',
})
export class ConnectorIproyalServerComponent implements IConnectorComponent, OnInit {
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

    products: string[] = [];

    countries: string[] = [];

    readonly subForm: FormGroup;

    processingProducts = false;

    processingCountries = false;

    constructor(
        @Inject(CommanderFrontendClientService)
        private readonly commander: ICommanderFrontendClient,
        fb: FormBuilder,
        private readonly toastsService: ToastsService
    ) {
        this.subForm = fb.group({
            product: [
                void 0, Validators.required,
            ],
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
                product: 'all',
                country: 'all',
            });
        }

        // Products
        this.processingProducts = true;
        this.commander.queryCredential(
            this.projectId,
            this.credentialId,
            {
                type: EIproyalServerQueryCredential.Products,
            }
        )
            .then((products) => {
                this.products = products;
            })
            .catch((err: any) => {
                console.error(err);

                this.toastsService.error(
                    'Connector Iproyal Server',
                    err.message
                );
            })
            .finally(() => {
                this.processingProducts = false;
            });

        // Countries
        this.processingCountries = true;
        this.commander.queryCredential(
            this.projectId,
            this.credentialId,
            {
                type: EIproyalServerQueryCredential.Countries,
            }
        )
            .then((country) => {
                this.countries = country;
            })
            .catch((err: any) => {
                console.error(err);

                this.toastsService.error(
                    'Connector Iproyal Server',
                    err.message
                );
            })
            .finally(() => {
                this.processingCountries = false;
            });
    }
}
