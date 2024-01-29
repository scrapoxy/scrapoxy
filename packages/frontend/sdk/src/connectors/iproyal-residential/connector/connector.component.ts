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
    CONNECTOR_IPROYAL_RESIDENTIAL_TYPE,
    EIproyalResidentialQueryCredential,
} from '@scrapoxy/common';
import { ValidatorLifetime } from './input-lifetime/input-lifetime.component';
import { CommanderFrontendClientService } from '../../../clients';
import { ToastsService } from '../../../toasts';
import type { IConnectorComponent } from '../../providers.interface';
import type { OnInit } from '@angular/core';
import type {
    ICommanderFrontendClient,
    IIproyalResidentialCountries,
    IIproyalResidentialItem,
} from '@scrapoxy/common';


@Component({
    selector: `connector-${CONNECTOR_IPROYAL_RESIDENTIAL_TYPE}`,
    templateUrl: 'connector.component.html',
})
export class ConnectorIproyalResidentialComponent implements IConnectorComponent, OnInit {
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

    readonly countries: IIproyalResidentialItem[] = [];

    readonly states: IIproyalResidentialItem[] = [];

    readonly cities: IIproyalResidentialItem[] = [];

    readonly subForm: FormGroup;

    processingCountries = false;

    private data: IIproyalResidentialCountries | undefined = void 0;

    constructor(
        @Inject(CommanderFrontendClientService)
        private readonly commander: ICommanderFrontendClient,
        fb: FormBuilder,
        private readonly toastsService: ToastsService
    ) {
        this.subForm = fb.group({
            lifetime: [
                void 0,
                [
                    Validators.required, ValidatorLifetime,
                ],
            ],
            country: [
                void 0, Validators.required,
            ],
            state: [
                void 0, Validators.required,
            ],
            city: [
                void 0, Validators.required,
            ],
            highEndPool: [
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
                lifetime: '24h',
                country: 'all',
                state: 'all',
                city: 'all',
                highEndPool: false,
            });
        }

        // Countries
        this.processingCountries = true;
        this.commander.queryCredential(
            this.projectId,
            this.credentialId,
            {
                type: EIproyalResidentialQueryCredential.Countries,
            }
        )
            .then((countries: IIproyalResidentialCountries) => {
                this.data = countries;

                this.countries.length = 0;
                for (const country of this.data.countries) {
                    this.countries.push({
                        code: country.code,
                        name: country.name,
                    });
                }

                this.selectCountry();
            })
            .catch((err: any) => {
                console.error(err);

                this.toastsService.error(
                    'Connector Iproyal Residential',
                    err.message
                );
            })
            .finally(() => {
                this.processingCountries = false;
            });
    }

    selectCountry() {
        this.states.length = 0;
        this.cities.length = 0;

        const countryCode = this.subForm.value.country;

        if (!this.data ||
            !countryCode ||
            countryCode === 'all') {
            this.subForm.patchValue({
                state: 'all',
                city: 'all',
            });

            return;
        }

        const country = this.data.countries.find((c: IIproyalResidentialItem) => c.code === countryCode);

        if (!country) {
            return;
        }

        for (const state of country.states.options) {
            this.states.push({
                code: state.code,
                name: state.name,
            });
        }

        for (const city of country.cities.options) {
            this.cities.push({
                code: city.code,
                name: city.name,
            });
        }
    }

    selectState() {
        if (this.subForm.value.state !== 'all') {
            this.subForm.patchValue({
                city: 'all',
            });
        }
    }

    selectCity() {
        if (this.subForm.value.city !== 'all') {
            this.subForm.patchValue({
                state: 'all',
            });
        }
    }
}
