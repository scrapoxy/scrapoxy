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
    CONNECTOR_PROXY_SELLER_RESIDENTIAL_TYPE,
    EProxySellerResidentialQueryCredential,


} from '@scrapoxy/common';
import {
    CommanderFrontendClientService,

    ToastsService,
} from '@scrapoxy/frontend-sdk';
import type { OnInit } from '@angular/core';
import type {
    ICommanderFrontendClient,
    IConnectorProxySellerResidentialQueryCities,

    IConnectorProxySellerResidentialQueryIsps,
    IConnectorProxySellerResidentialQueryRegions,
    IProxySellerGeoCountryView,
} from '@scrapoxy/common';
import type { IConnectorComponent } from '@scrapoxy/frontend-sdk';


@Component({
    selector: `connector-${CONNECTOR_PROXY_SELLER_RESIDENTIAL_TYPE}`,
    templateUrl: 'connector.component.html',
})
export class ConnectorProxySellerResidentialComponent implements IConnectorComponent, OnInit {
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

    readonly subForm: FormGroup;

    readonly countries: IProxySellerGeoCountryView[] = [];

    readonly regions: string[] = [];

    readonly cities: string[] = [];

    readonly isps: string[] = [];

    processingCountries = false;

    processingRegions = false;

    processingCities = false;

    processingIsps = false;

    constructor(
        @Inject(CommanderFrontendClientService)
        private readonly commander: ICommanderFrontendClient,
        fb: FormBuilder,
        private readonly toastsService: ToastsService
    ) {
        this.subForm = fb.group({
            countryCode: [
                void 0, Validators.required,
            ],
            region: [
                void 0, Validators.required,
            ],
            city: [
                void 0, Validators.required,
            ],
            isp: [
                void 0, Validators.required,
            ],
            title: [
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
                countryCode: 'all',
                region: 'all',
                city: 'all',
                isp: 'all',
                title: 'Scrapoxy',
            });
        }

        // Countries
        this.processingCountries = true;
        this.commander.queryCredential(
            this.projectId,
            this.credentialId,
            {
                type: EProxySellerResidentialQueryCredential.Countries,
            }
        )
            .then((countries: IProxySellerGeoCountryView[]) => {
                this.countries.push(...countries.sort((
                    a, b
                ) => a.name.localeCompare(b.name)));

                this.selectCountry();
            })
            .catch((err: any) => {
                console.error(err);

                this.toastsService.error(
                    'Connector Proxy-Seller Residential',
                    err.message
                );
            })
            .finally(() => {
                this.processingCountries = false;
            });
    }

    selectCountry() {
        this.regions.length = 0;
        this.cities.length = 0;
        this.isps.length = 0;

        const countryCode = this.subForm.value.countryCode;

        if (!this.countries ||
            !countryCode ||
            countryCode === 'all') {
            this.subForm.patchValue({
                region: 'all',
                city: 'all',
                isp: 'all',
            });

            return;
        }

        // Regions
        this.processingRegions = true;

        const parameters: IConnectorProxySellerResidentialQueryRegions = {
            countryCode,
        };

        this.commander.queryCredential(
            this.projectId,
            this.credentialId,
            {
                type: EProxySellerResidentialQueryCredential.Regions,
                parameters,
            }
        )
            .then((regions: string[]) => {
                this.regions.push(...regions.sort());

                const currentRegion = this.subForm.value.region;

                if (currentRegion !== 'all' && !this.regions.includes(currentRegion)) {
                    this.subForm.patchValue({
                        region: 'all',
                    });
                }

                this.selectRegion();
            })
            .catch((err: any) => {
                console.error(err);

                this.toastsService.error(
                    'Connector Proxy-Seller Residential',
                    err.message
                );
            })
            .finally(() => {
                this.processingRegions = false;
            });
    }

    selectRegion() {
        this.cities.length = 0;
        this.isps.length = 0;

        const region = this.subForm.value.region;

        if (!this.cities ||
            !region ||
            region === 'all') {
            this.subForm.patchValue({
                city: 'all',
                isp: 'all',
            });

            return;
        }

        // Cities
        this.processingCities = true;

        const parameters: IConnectorProxySellerResidentialQueryCities = {
            countryCode: this.subForm.value.countryCode,
            region,
        };

        this.commander.queryCredential(
            this.projectId,
            this.credentialId,
            {
                type: EProxySellerResidentialQueryCredential.Cities,
                parameters,
            }
        )
            .then((cities: string[]) => {
                this.cities.push(...cities.sort());

                const currentCity = this.subForm.value.city;

                if (currentCity !== 'all' && !this.cities.includes(currentCity)) {
                    this.subForm.patchValue({
                        city: 'all',
                    });
                }

                this.selectCity();
            })
            .catch((err: any) => {
                console.error(err);

                this.toastsService.error(
                    'Connector Proxy-Seller Residential',
                    err.message
                );
            })
            .finally(() => {
                this.processingCities = false;
            });
    }

    selectCity() {
        this.isps.length = 0;

        const city = this.subForm.value.city;

        if (!this.isps ||
            !city ||
            city === 'all') {
            this.subForm.patchValue({
                isp: 'all',
            });

            return;
        }

        // ISPs
        this.processingIsps = true;

        const parameters: IConnectorProxySellerResidentialQueryIsps = {
            countryCode: this.subForm.value.countryCode,
            region: this.subForm.value.region,
            city,
        };

        this.commander.queryCredential(
            this.projectId,
            this.credentialId,
            {
                type: EProxySellerResidentialQueryCredential.Isps,
                parameters,
            }
        )
            .then((isps: string[]) => {
                this.isps.push(...isps.sort());

                const currentIsp = this.subForm.value.isp;

                if (currentIsp !== 'all' && !this.isps.includes(currentIsp)) {
                    this.subForm.patchValue({
                        isp: 'all',
                    });
                }
            })
            .catch((err: any) => {
                console.error(err);

                this.toastsService.error(
                    'Connector Proxy-Seller Residential',
                    err.message
                );
            })
            .finally(() => {
                this.processingIsps = false;
            });
    }
}
