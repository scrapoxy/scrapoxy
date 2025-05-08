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
} from '@scrapoxy/common';
import {
    CommanderFrontendClientService,
    ToastsService,
} from '@scrapoxy/frontend-sdk';
import type { OnInit } from '@angular/core';
import type {
    ICommanderFrontendClient,
    IIproyalServerQueryCountries,
} from '@scrapoxy/common';
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

    countries: string[] = [];

    readonly subForm: FormGroup;

    processingCountries = false;

    constructor(
        @Inject(CommanderFrontendClientService)
        private readonly commander: ICommanderFrontendClient,
        fb: FormBuilder,
        private readonly toastsService: ToastsService
    ) {
        this.subForm = fb.group({
            productId: [
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
                productId: 3,
                country: 'all',
            });
        }

        await Promise.resolve();

        await this.updateCountries(this.subForm.value.productId);
    }

    async productIdChanged(): Promise<void> {
        const productId = this.subForm.value.productId;

        if (productId) {
            await this.updateCountries(productId);
        } else {
            await this.updateCountries();
        }
    }

    private async updateCountries(productId?: number): Promise<void> {
        console.log(
            'updateCountries',
            productId
        );

        if (productId) {
            this.processingCountries = true;

            try {
                const parameters: IIproyalServerQueryCountries = {
                    productId,
                };

                this.countries = await this.commander.queryCredential(
                    this.projectId,
                    this.credentialId,
                    {
                        type: EIproyalServerQueryCredential.Countries,
                        parameters,
                    }
                )
                    .then((countries) => countries.sort());

                if (this.subForm.value.country && !this.countries.includes(this.subForm.value.country)) {
                    this.subForm.patchValue({
                        country: 'all',
                    });
                }
            } catch (err: any) {
                console.error(err);

                this.toastsService.error(
                    'Connector Iproyal Server',
                    err.message
                );
            } finally {
                this.processingCountries = false;
            }
        } else {
            this.countries = [];
        }
    }
}
