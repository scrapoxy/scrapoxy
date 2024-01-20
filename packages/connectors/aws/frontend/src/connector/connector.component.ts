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
import { SCRAPOXY_DATACENTER_PREFIX } from '@scrapoxy/common';
import {
    AWS_DEFAULT_INSTANCE_TYPE,
    AWS_DEFAULT_REGION,
    CONNECTOR_AWS_TYPE,
    EAwsQueryCredential,
} from '@scrapoxy/connector-aws-sdk';
import {
    CommanderFrontendClientService,
    ToastsService,
} from '@scrapoxy/frontend-sdk';
import type { OnInit } from '@angular/core';
import type { ICommanderFrontendClient } from '@scrapoxy/common';
import type { IAwsQueryInstanceType } from '@scrapoxy/connector-aws-sdk';
import type { IConnectorComponent } from '@scrapoxy/frontend-sdk';


@Component({
    selector: `connector-${CONNECTOR_AWS_TYPE}`,
    templateUrl: 'connector.component.html',
})
export class ConnectorAwsComponent implements IConnectorComponent, OnInit {
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

    instanceTypes: string[] = [];

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
            imageId: [
                void 0,
            ],
            securityGroupName: [
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
                region: AWS_DEFAULT_REGION,
                port: 3128,
                instanceType: AWS_DEFAULT_INSTANCE_TYPE,
                imageId: 'spximage',
                securityGroupName: SCRAPOXY_DATACENTER_PREFIX,
                tag: 'spx',
            });
        }

        this.processingRegions = true;

        try {
            this.regions = await this.commander.queryCredential(
                this.projectId,
                this.credentialId,
                {
                    type: EAwsQueryCredential.Regions,
                }
            )
                .then((regions) => regions.sort());

            await this.updateInstanceType(this.subForm.value.region);
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Connector AWS',
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
                const parameters: IAwsQueryInstanceType = {
                    region,
                };

                this.instanceTypes = await this.commander.queryCredential(
                    this.projectId,
                    this.credentialId,
                    {
                        type: EAwsQueryCredential.InstanceTypes,
                        parameters,
                    }
                )
                    .then((instanceTypes) => instanceTypes.sort());
            } catch (err: any) {
                console.error(err);

                this.toastsService.error(
                    'Connector AWS',
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
