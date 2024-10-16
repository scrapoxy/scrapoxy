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
    CONNECTOR_PROXYRACK_TYPE,
    EProxyrackQueryCredential,
} from '@scrapoxy/common';
import {
    CommanderFrontendClientService,
    convertCodesToCountries,
    ToastsService,
} from '@scrapoxy/frontend-sdk';
import type { OnInit } from '@angular/core';
import type {
    ICommanderFrontendClient,
    IIsocodeCountry,
    IProxyrackQueryByCountry,
} from '@scrapoxy/common';
import type { IConnectorComponent } from '@scrapoxy/frontend-sdk';


@Component({
    selector: `connector-${CONNECTOR_PROXYRACK_TYPE}`,
    templateUrl: 'connector.component.html',
})
export class ConnectorProxyrackComponent implements IConnectorComponent, OnInit {
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

    cities: string[] = [];

    isps: string[] = [];

    proxiesCount: number | undefined;

    readonly subForm: FormGroup;

    processingCountries = false;

    processingCities = false;

    processingIsps = false;

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
            city: [
                void 0, Validators.required,
            ],
            isp: [
                void 0, Validators.required,
            ],
            osName: [
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
                city: 'all',
                isp: 'all',
                osName: 'all',
            });
        }

        this.processingCountries = true;

        try {
            this.countries = await this.commander.queryCredential(
                this.projectId,
                this.credentialId,
                {
                    type: EProxyrackQueryCredential.Countries,
                }
            )
                .then((codes: string[]) => convertCodesToCountries(codes));

            await Promise.all([
                this.updateCities(this.subForm.value.country), this.updateIsps(this.subForm.value.country), this.updateProxiesCount(this.subForm.value.country),
            ]);
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Connector Proxyrack',
                err.message
            );
        } finally {
            this.processingCountries = false;
        }
    }

    async countryChanged(): Promise<void> {
        const country = this.subForm.value.country;

        await Promise.all([
            this.updateCities(country), this.updateIsps(country), this.updateProxiesCount(country),
        ]);
    }

    private async updateCities(country: string): Promise<void> {
        if (!country || country.length <= 0 || country === 'all') {
            this.cities = [];
        } else {
            this.processingCities = true;

            try {
                const parameters: IProxyrackQueryByCountry = {
                    country,
                };

                this.cities = await this.commander.queryCredential(
                    this.projectId,
                    this.credentialId,
                    {
                        type: EProxyrackQueryCredential.Cities,
                        parameters,
                    }
                )
                    .then((cities: string[]) => cities.sort());
            } catch (err: any) {
                console.error(err);

                this.toastsService.error(
                    'Connector Proxyrack',
                    err.message
                );
            } finally {
                this.processingCities = false;
            }
        }
    }

    private async updateIsps(country: string): Promise<void> {
        if (!country || country.length <= 0 || country === 'all') {
            this.isps = [];
        } else {
            this.processingIsps = true;

            try {
                const parameters: IProxyrackQueryByCountry = {
                    country,
                };

                this.isps = await this.commander.queryCredential(
                    this.projectId,
                    this.credentialId,
                    {
                        type: EProxyrackQueryCredential.Isps,
                        parameters,
                    }
                )
                    .then((isps: string[]) => isps.sort());
            } catch (err: any) {
                console.error(err);

                this.toastsService.error(
                    'Connector Proxyrack',
                    err.message
                );
            } finally {
                this.processingIsps = false;
            }
        }
    }

    private async updateProxiesCount(country: string): Promise<void> {
        this.proxiesCount = void 0;

        if (country && country.length > 0 && country !== 'all') {
            try {
                const parameters: IProxyrackQueryByCountry = {
                    country,
                };

                this.proxiesCount = await this.commander.queryCredential(
                    this.projectId,
                    this.credentialId,
                    {
                        type: EProxyrackQueryCredential.ProxiesCount,
                        parameters,
                    }
                );
            } catch (err: any) {
                console.error(err);

                this.toastsService.error(
                    'Connector Proxyrack',
                    err.message
                );
            }
        }
    }
}
