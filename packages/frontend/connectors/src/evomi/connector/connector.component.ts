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
    CONNECTOR_EVOMI_TYPE,
    convertCodesToCountries,
    EEvomiProduct,
    EEvomiQueryCredential,
} from '@scrapoxy/common';
import {
    CommanderFrontendClientService,
    ToastsService,
} from '@scrapoxy/frontend-sdk';
import type { OnInit } from '@angular/core';
import type {
    ICommanderFrontendClient,
    IEvomiProduct,
    IEvomiQueryProduct,
    IIsocodeCountry,
} from '@scrapoxy/common';
import type { IConnectorComponent } from '@scrapoxy/frontend-sdk';


@Component({
    selector: `connector-${CONNECTOR_EVOMI_TYPE}`,
    templateUrl: 'connector.component.html',
})
export class ConnectorEvomiComponent implements IConnectorComponent, OnInit {
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

    EEvomiProduct = EEvomiProduct;

    products: string[] = [];

    countries: IIsocodeCountry[] = [];

    readonly subForm: FormGroup;

    apiKeyType = 'password';

    processingProduct = false;

    processingProducts = false;

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
            hostname: [
                void 0,
            ],
            port: [
                void 0, Validators.required,
            ],
            username: [
                void 0,
            ],
            password: [
                void 0,
            ],
            country: [
                void 0, Validators.required,
            ],
        });
    }

    toProductName(product: string): string {
        switch (product) {
            case EEvomiProduct.ResidentialPremium: {
                return 'Residential Premium';
            }
            case EEvomiProduct.CoreResidential: {
                return 'Core Residential';
            }
            case EEvomiProduct.Datacenter: {
                return 'Datacenter Proxies';
            }
            case EEvomiProduct.Mobile: {
                return 'Mobile Proxies';
            }
            case EEvomiProduct.StaticResidential: {
                return 'Static Residential';
            }
            default: {
                return '';
            }
        }
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

        this.processingProducts = true;

        try {
            this.products = await this.commander.queryCredential(
                this.projectId,
                this.credentialId,
                {
                    type: EEvomiQueryCredential.Products,
                }
            )
                .then((product: string[]) => product.sort());

            // Assign a product if none is selected
            if (this.products.length > 0 &&
                (!this.subForm.value.product || this.subForm.value.product.length <= 0)) {
                this.subForm.patchValue({
                    product: this.products[ 0 ],
                });
            }

            await this.productChanged();
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Connector Evomi',
                err.message
            );
        } finally {
            this.processingProducts = false;
        }
    }

    async productChanged(): Promise<void> {
        const product = this.subForm.value.product;

        if (!product || product.length <= 0) {
            this.subForm.patchValue({
                hostname: void 0,
                port: 0,
                username: void 0,
                password: void 0,
                country: void 0,
            });

            return;
        }

        this.processingProduct = true;

        try {
            const parameters: IEvomiQueryProduct = {
                product,
            };
            const productResult: IEvomiProduct = await this.commander.queryCredential(
                this.projectId,
                this.credentialId,
                {
                    type: EEvomiQueryCredential.Product,
                    parameters,
                }
            );

            this.subForm.patchValue({
                hostname: productResult.hostname,
                port: productResult.port,
                username: productResult.username,
                password: productResult.password,
            });

            this.countries = convertCodesToCountries(productResult.countries);

            // Existing country is not available in the new zone, reset it
            if (this.countries.findIndex((c) => c.code === this.subForm.value.country) < 0) {
                this.subForm.patchValue({
                    country: 'all',
                });
            }
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Connector Evomi',
                err.message
            );

            this.subForm.patchValue({
                hostname: void 0,
                port: 0,
                username: void 0,
                password: void 0,
                country: void 0,
            });
        } finally {
            this.processingProduct = false;
        }
    }

    togglePassword() {
        if (this.apiKeyType === 'password') {
            this.apiKeyType = 'text';
        } else {
            this.apiKeyType = 'password';
        }
    }
}
