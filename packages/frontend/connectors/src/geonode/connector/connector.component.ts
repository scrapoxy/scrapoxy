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
    CONNECTOR_GEONODE_TYPE,
    EGeonodeProductType,
    EGeonodeQueryCredential,
} from '@scrapoxy/common';
import {
    CommanderFrontendClientService,
    ToastsService,
} from '@scrapoxy/frontend-sdk';
import type { OnInit } from '@angular/core';
import type {
    ICommanderFrontendClient,
    IGeonodeQueryCountries,
    IIsocodeCountry,
} from '@scrapoxy/common';
import type { IConnectorComponent } from '@scrapoxy/frontend-sdk';


@Component({
    selector: `connector-${CONNECTOR_GEONODE_TYPE}`,
    templateUrl: 'connector.component.html',
})
export class ConnectorGeonodeComponent implements IConnectorComponent, OnInit {
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

    countries: IIsocodeCountry[] = [];

    readonly subForm: FormGroup;

    processingCountries = false;

    EGeonodeProductType = EGeonodeProductType;

    constructor(
        @Inject(CommanderFrontendClientService)
        private readonly commander: ICommanderFrontendClient,
        fb: FormBuilder,
        private readonly toastsService: ToastsService
    ) {
        this.subForm = fb.group({
            productType: [
                void 0, Validators.required,
            ],
            country: [
                void 0, Validators.required,
            ],
            lifetime: [
                void 0,
                [
                    // eslint-disable-next-line array-element-newline
                    Validators.required, Validators.min(3), // 3 mins
                    Validators.max(1440), // 24 hours
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

        if (this.createMode) {
            this.subForm.patchValue({
                productType: EGeonodeProductType.RESIDENTIAL_PREMIUM,
                country: 'all',
                lifetime: 10,
            });
        }

        await Promise.resolve();

        await this.updateCountries(this.subForm.value.productType);
    }

    async productTypeChanged(): Promise<void> {
        const productType = this.subForm.value.productType;
        await this.updateCountries(productType);
    }

    private async updateCountries(productType: EGeonodeProductType) {
        if (!productType) {
            return;
        }

        this.processingCountries = true;
        try {
            const parameters: IGeonodeQueryCountries = {
                productType,
            };

            this.countries = await this.commander.queryCredential(
                this.projectId,
                this.credentialId,
                {
                    type: EGeonodeQueryCredential.Countries,
                    parameters,
                }
            );
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Connector AWS',
                err.message
            );
        } finally {
            this.processingCountries = false;
        }
    }
}
