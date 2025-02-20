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
    CONNECTOR_SCALEWAY_TYPE,
    EScalewayQueryCredential,
    SCALEWAY_DEFAULT_INSTANCE_TYPE,
    SCALEWAY_DEFAULT_REGION,
} from '@scrapoxy/common';
import {
    CommanderFrontendClientService,
    ToastsService,
} from '@scrapoxy/frontend-sdk';
import type { OnInit } from '@angular/core';
import type {
    ICommanderFrontendClient,
    IScalewayInstanceType,
    IScalewayQueryInstanceType,
} from '@scrapoxy/common';
import type { IConnectorComponent } from '@scrapoxy/frontend-sdk';


@Component({
    selector: `connector-${CONNECTOR_SCALEWAY_TYPE}`,
    templateUrl: 'connector.component.html',
})
export class ConnectorScalewayComponent implements IConnectorComponent, OnInit {
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

    instanceTypes: IScalewayInstanceType[] = [];

    readonly subForm: FormGroup;

    processingRegions = false;

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
            instanceType: [
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
                region: SCALEWAY_DEFAULT_REGION,
                port: 3128,
                instanceType: SCALEWAY_DEFAULT_INSTANCE_TYPE,
                tag: 'spx',
            });
        }

        this.processingRegions = true;

        try {
            this.regions = await this.commander.queryCredential(
                this.projectId,
                this.credentialId,
                {
                    type: EScalewayQueryCredential.Regions,
                }
            )
                .then((regions) => regions.sort());

            await this.updateInstanceType(this.subForm.value.region);
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Connector Scaleway',
                err.message
            );
        } finally {
            this.processingRegions = false;
        }
    }

    async regionChanged(): Promise<void> {
        const region = this.subForm.value.region;

        if (region) {
            await this.updateInstanceType(region);
        } else {
            await this.updateInstanceType();
        }
    }

    private async updateInstanceType(region?: string): Promise<void> {
        if (
            this.projectId &&
            this.credentialId &&
            region
        ) {
            this.processingInstanceTypes = true;

            try {
                const parameters: IScalewayQueryInstanceType = {
                    region,
                };

                this.instanceTypes = await this.commander.queryCredential(
                    this.projectId,
                    this.credentialId,
                    {
                        type: EScalewayQueryCredential.InstanceTypes,
                        parameters,
                    }
                )
                    .then((instanceTypes: IScalewayInstanceType[]) => instanceTypes.sort((
                        a, b
                    ) => a.hourlyPrice - b.hourlyPrice));
            } catch (err: any) {
                console.error(err);

                this.toastsService.error(
                    'Connector Scaleway',
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
