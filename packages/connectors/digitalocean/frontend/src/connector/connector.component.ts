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
    CONNECTOR_DIGITALOCEAN_TYPE,
    DIGITALOCEAN_DEFAULT_REGION,
    DIGITALOCEAN_DEFAULT_SIZE,
    EDigitalOceanQueryCredential,
} from '@scrapoxy/connector-digitalocean-sdk';
import {
    CommanderFrontendClientService,
    ToastsService,
} from '@scrapoxy/frontend-sdk';
import type { OnInit } from '@angular/core';
import type { ICommanderFrontendClient } from '@scrapoxy/common';
import type {
    IDigitalOceanQuerySizes,
    IDigitalOceanQuerySnapshots,
    IDigitalOceanRegionView,
    IDigitalOceanSizeView,
    IDigitalOceanSnapshotView,
} from '@scrapoxy/connector-digitalocean-sdk';
import type { IConnectorComponent } from '@scrapoxy/frontend-sdk';


@Component({
    selector: `connector-${CONNECTOR_DIGITALOCEAN_TYPE}`,
    templateUrl: 'connector.component.html',
})
export class ConnectorDigitaloceanComponent implements IConnectorComponent, OnInit {
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

    regions: IDigitalOceanRegionView[] = [];

    sizes: IDigitalOceanSizeView[] = [];

    snapshots: IDigitalOceanSnapshotView[] = [];

    readonly subForm: FormGroup;

    processingRegions = false;

    processingSizes = false;

    processingSnapshots = false;

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
            size: [
                void 0, Validators.required,
            ],
            snapshotId: [
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
                region: DIGITALOCEAN_DEFAULT_REGION,
                port: 3128,
                size: DIGITALOCEAN_DEFAULT_SIZE,
                tag: 'spx',
                snapshotId: '',
            });
        }

        await this.updateRegions();
    }

    async regionChanged(): Promise<void> {
        const region = this.subForm.value.region;

        await Promise.all([
            this.updateSizes(region), this.updateSnapshots(region),
        ]);
    }

    private async updateRegions(): Promise<void> {
        this.processingRegions = true;

        try {
            this.regions = await this.commander.queryCredential(
                this.projectId,
                this.credentialId,
                {
                    type: EDigitalOceanQueryCredential.Regions,
                }
            )
                .then((rgs: IDigitalOceanRegionView[]) => rgs.sort((
                    a, b
                ) => a.name.localeCompare(b.name)));
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Connector DO',
                err.message
            );
        } finally {
            this.processingRegions = false;
        }

        await this.regionChanged();
    }

    private async updateSizes(region?: string): Promise<void> {
        if (region) {
            this.processingSizes = true;

            try {
                const parameters: IDigitalOceanQuerySizes = {
                    region,
                };

                this.sizes = await this.commander.queryCredential(
                    this.projectId,
                    this.credentialId,
                    {
                        type: EDigitalOceanQueryCredential.Sizes,
                        parameters,
                    }
                )
                    .then((szs: IDigitalOceanSizeView[]) => szs.sort((
                        a, b
                    ) => a.description.localeCompare(b.description)));
            } catch (err: any) {
                console.error(err);

                this.toastsService.error(
                    'Connector DO',
                    err.message
                );
            } finally {
                this.processingSizes = false;
            }
        } else {
            this.sizes = [];
        }
    }

    private async updateSnapshots(region?: string): Promise<void> {
        if (region) {
            this.processingSnapshots = true;

            try {
                const parameters: IDigitalOceanQuerySnapshots = {
                    region,
                };

                this.snapshots = await this.commander.queryCredential(
                    this.projectId,
                    this.credentialId,
                    {
                        type: EDigitalOceanQueryCredential.Snapshots,
                        parameters,
                    }
                )
                    .then((snp: IDigitalOceanSnapshotView[]) => snp.sort((
                        a, b
                    ) => a.name.localeCompare(b.name)));
            } catch (err: any) {
                console.error(err);

                this.toastsService.error(
                    'Connector DO',
                    err.message
                );
            } finally {
                this.processingSnapshots = false;
            }
        } else {
            this.snapshots = [];
        }
    }
}
