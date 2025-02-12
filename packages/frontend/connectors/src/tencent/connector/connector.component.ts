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
    CONNECTOR_TENCENT_TYPE,
    ETencentQueryCredential,
    TENCENT_DEFAULT_INSTANCE_TYPE,
    TENCENT_DEFAULT_REGION,
    TENCENT_DEFAULT_ZONE,
} from '@scrapoxy/common';
import {
    CommanderFrontendClientService,
    ToastsService,
} from '@scrapoxy/frontend-sdk';
import type { OnInit } from '@angular/core';
import type {
    ICommanderFrontendClient,
    ITencentQueryInstanceType,
    ITencentQueryZone,
} from '@scrapoxy/common';
import type { IConnectorComponent } from '@scrapoxy/frontend-sdk';


@Component({
    selector: `connector-${CONNECTOR_TENCENT_TYPE}`,
    templateUrl: 'connector.component.html',
})
export class ConnectorTencentComponent implements IConnectorComponent, OnInit {
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

    regions: string[] = [];

    zones: string[] = [];

    instanceTypes: string[] = [];

    readonly subForm: FormGroup;

    processingRegions = false;

    processingZones = false;

    processingInstanceTypes = false;

    constructor(
        @Inject(CommanderFrontendClientService)
        private readonly commander: ICommanderFrontendClient,
        fb: FormBuilder,
        private readonly toastsService: ToastsService
    ) {
        this.subForm = fb.group({
            region: [
                void 0, Validators.required,
            ],
            port: [
                void 0,
                [
                    Validators.required, Validators.min(1024), Validators.max(65535),
                ],
            ],
            zone: [
                void 0, Validators.required,
            ],
            instanceType: [
                void 0, Validators.required,
            ],
            projectId: [
                void 0, Validators.pattern(/^\d+$/),
            ],
            imageId: [
                void 0,
            ],
            tag: [
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
                region: TENCENT_DEFAULT_REGION,
                port: 3128,
                zone: TENCENT_DEFAULT_ZONE,
                instanceType: TENCENT_DEFAULT_INSTANCE_TYPE,
                projectId: '',
                imageId: '',
                tag: 'spx',
            });
        }

        this.processingRegions = true;

        try {
            this.regions = await this.commander.queryCredential(
                this.projectId,
                this.credentialId,
                {
                    type: ETencentQueryCredential.Regions,
                }
            )
                .then((regions) => regions.sort());

            await this.updateZone(this.subForm.value.region);
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Connector Tencent',
                err.message
            );
        } finally {
            this.processingRegions = false;
        }
    }

    async regionChanged(): Promise<void> {
        const region = this.subForm.value.region;

        if (region) {
            await this.updateZone(region);
        } else {
            await this.updateZone();
        }
    }

    async zoneChanged(): Promise<void> {
        const zone = this.subForm.value.zone;
        const region = this.subForm.value.region;

        if (zone) {
            await this.updateInstanceType(
                zone,
                region
            );
        } else {
            await this.updateInstanceType();
        }
    }

    private async updateZone(region?: string): Promise<void> {
        if (
            this.projectId &&
            this.credentialId &&
            region
        ) {
            this.processingZones = true;

            try {
                const parameters: ITencentQueryZone = {
                    region,
                };

                this.zones = await this.commander.queryCredential(
                    this.projectId,
                    this.credentialId,
                    {
                        type: ETencentQueryCredential.Zones,
                        parameters,
                    }
                )
                    .then((zones: string[]) => zones.sort());

                let zone = this.subForm.value.zone as string | undefined;

                // Set the default zone if zone is not in the list
                if (zone &&
                    this.zones.length > 0 &&
                    !this.zones.includes(zone)) {
                    if (this.zones.includes(TENCENT_DEFAULT_ZONE)) {
                        zone = TENCENT_DEFAULT_ZONE;
                    } else {
                        zone = this.zones[ 0 ];
                    }

                    this.subForm.patchValue({
                        zone,
                    });
                }

                await this.updateInstanceType(
                    this.subForm.value.zone,
                    this.subForm.value.region
                );

            } catch (err: any) {
                console.error(err);

                this.toastsService.error(
                    'Connector Tencent',
                    err.message
                );
            } finally {
                this.processingZones = false;
            }
        } else {
            this.zones = [];
        }
    }

    private async updateInstanceType(
        zone?: string, region?: string
    ): Promise<void> {
        if (
            this.projectId &&
            this.credentialId &&
            region &&
            zone
        ) {
            this.processingInstanceTypes = true;

            try {
                const parameters: ITencentQueryInstanceType = {
                    region,
                    zone,
                };

                this.instanceTypes = await this.commander.queryCredential(
                    this.projectId,
                    this.credentialId,
                    {
                        type: ETencentQueryCredential.InstanceTypes,
                        parameters,
                    }
                )
                    .then((instanceTypes: string[]) => {
                        const sortedInstanceType = instanceTypes.sort();
                        this.subForm.patchValue({
                            instanceType: sortedInstanceType.includes(TENCENT_DEFAULT_INSTANCE_TYPE) ? TENCENT_DEFAULT_INSTANCE_TYPE : sortedInstanceType[ 0 ],
                        });

                        return instanceTypes.sort();
                    });
            } catch (err: any) {
                console.error(err);

                this.toastsService.error(
                    'Connector Tencent',
                    err.message
                );
            } finally {
                this.processingInstanceTypes = false;
            }
        } else {
            this.instanceTypes = [];
        }
    }
}
