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
} from '@scrapoxy/common';
import {
    CommanderFrontendClientService,
    ToastsService,
} from '@scrapoxy/frontend-sdk';
import type { OnInit } from '@angular/core';
import type {
    ICommanderFrontendClient,
    IDigitalOceanQuerySizes,
    IDigitalOceanRegionView,
    IDigitalOceanSizeView,
} from '@scrapoxy/common';
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

    readonly subForm: FormGroup;

    processingRegions = false;

    processingSizes = false;

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
            });
        }

        await this.updateRegions();
    }

    async regionChanged(): Promise<void> {
        const region = this.subForm.value.region;

        await this.updateSizes(region);
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
}
