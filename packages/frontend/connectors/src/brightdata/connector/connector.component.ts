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
    CONNECTOR_BRIGHTDATA_TYPE,
    convertCodesToCountries,
    EBrightdataProductType,
    EBrightdataQueryCredential,
} from '@scrapoxy/common';
import {
    CommanderFrontendClientService,
    ToastsService,
} from '@scrapoxy/frontend-sdk';
import type { OnInit } from '@angular/core';
import type {
    IBrightdataQueryZone,
    IBrightdataUsername,
    IBrightdataZoneView,
    ICommanderFrontendClient,
    IIsocodeCountry,
} from '@scrapoxy/common';
import type { IConnectorComponent } from '@scrapoxy/frontend-sdk';


@Component({
    selector: `connector-${CONNECTOR_BRIGHTDATA_TYPE}`,
    templateUrl: 'connector.component.html',
    styleUrls: [
        'connector.component.scss',
    ],
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

    EBrightdataProductType = EBrightdataProductType;

    zones: string[] = [];

    countries: IIsocodeCountry[] = [];

    readonly subForm: FormGroup;

    passwordType = 'password';

    processingUsername = false;

    processingZone = false;

    processingZones = false;

    constructor(
        @Inject(CommanderFrontendClientService)
        private readonly commander: ICommanderFrontendClient,
        fb: FormBuilder,
        private readonly toastsService: ToastsService
    ) {
        this.subForm = fb.group({
            zoneName: [
                void 0, Validators.required,
            ],
            productType: [
                void 0, Validators.required,
            ],
            username: [
                void 0, Validators.required,
            ],
            password: [
                void 0, Validators.required,
            ],
            country: [
                void 0, Validators.required,
            ],
        });
    }

    get serverProductType(): boolean {
        switch (this.subForm.value.productType) {
            // Server
            case EBrightdataProductType.DatacenterSharedUnlimited:
            case EBrightdataProductType.DatacenterDedicatedUnlimited:
            case EBrightdataProductType.IspSharedUnlimited:
            case EBrightdataProductType.IspDedicatedUnlimited:
            case EBrightdataProductType.ResidentialDedicated: {
                return true;
            }

            default: {
                return false;
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

        this.processingZones = true;

        try {
            const usernamePromise: Promise<IBrightdataUsername> = this.commander.queryCredential(
                this.projectId,
                this.credentialId,
                {
                    type: EBrightdataQueryCredential.Username,
                }
            )
                .then((data) => data.username);
            const zonesPromise: Promise<string[]> = this.commander.queryCredential(
                this.projectId,
                this.credentialId,
                {
                    type: EBrightdataQueryCredential.Zones,
                }
            )
                .then((zns: string[]) => zns.sort());
            const [
                username, zones,
            ] = await Promise.all([
                usernamePromise, zonesPromise,
            ]);

            this.subForm.patchValue({
                username,
            });

            this.zones = zones;

            await this.zoneNameChanged();
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Connector Bright Data',
                err.message
            );

            this.subForm.patchValue({
                username: void 0,
            });
        } finally {
            this.processingZones = false;
        }
    }

    getProductTypeLabel(productType: EBrightdataProductType | undefined): string {
        switch (productType) {
            case EBrightdataProductType.DatacenterSharedPayperusage: {
                return 'Datacenter - Shared (Pay per GB)';
            }
            case EBrightdataProductType.DatacenterSharedUnlimited: {
                return 'Datacenter - Shared Unlimited';
            }
            case EBrightdataProductType.DatacenterDedicatedUnlimited: {
                return 'Datacenter - Dedicated Unlimited';
            }
            case EBrightdataProductType.IspSharedPayPerUsage: {
                return 'ISP - Shared (Pay per GB)';
            }
            case EBrightdataProductType.IspSharedUnlimited: {
                return 'ISP - Shared Unlimited';
            }
            case EBrightdataProductType.IspDedicatedUnlimited: {
                return 'ISP - Dedicated Unlimited';
            }
            case EBrightdataProductType.ResidentialShared: {
                return 'Residential - Shared';
            }
            case EBrightdataProductType.ResidentialDedicated: {
                return 'Residential - Dedicated';
            }
            case EBrightdataProductType.MobileShared: {
                return 'Mobile - Shared (Pay per GB)';
            }
            case EBrightdataProductType.MobileDedicated: {
                return 'Mobile - Dedicated';
            }
            default: {
                return '';
            }
        }
    }

    async zoneNameChanged(): Promise<void> {
        const zoneName = this.subForm.value.zoneName;

        if (!zoneName || zoneName.length <= 0) {
            this.subForm.patchValue({
                productType: void 0,
                password: void 0,
            });

            return;
        }

        this.processingZone = true;

        try {
            const parameters: IBrightdataQueryZone = {
                zoneName,
            };
            const zone: IBrightdataZoneView = await this.commander.queryCredential(
                this.projectId,
                this.credentialId,
                {
                    type: EBrightdataQueryCredential.Zone,
                    parameters,
                }
            );

            this.subForm.patchValue({
                productType: zone.productType,
                password: zone.password,
            });

            this.countries = convertCodesToCountries(zone.countries);

            // Existing country is not available in the new zone, reset it
            if (this.countries.findIndex((c) => c.code === this.subForm.value.country) < 0) {
                this.subForm.patchValue({
                    country: 'all',
                });
            }
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Connector Bright Data',
                err.message
            );

            this.subForm.patchValue({
                productType: void 0,
                password: void 0,
            });
        } finally {
            this.processingZone = false;
        }
    }

    togglePassword() {
        if (this.passwordType === 'password') {
            this.passwordType = 'text';
        } else {
            this.passwordType = 'password';
        }
    }
}
