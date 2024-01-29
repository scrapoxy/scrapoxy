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
    AZURE_DEFAULT_LOCATION,
    AZURE_DEFAULT_STORAGE_ACCOUNT_TYPE,
    AZURE_DEFAULT_VM_SIZE,
    CONNECTOR_AZURE_TYPE,
    EAzureQueryCredential,
    SCRAPOXY_DATACENTER_PREFIX,
} from '@scrapoxy/common';
import { CommanderFrontendClientService } from '../../../clients';
import { ToastsService } from '../../../toasts';
import type { IConnectorComponent } from '../../providers.interface';
import type { OnInit } from '@angular/core';
import type {
    IAzureLocation,
    IAzureQueryVmSizes,
    IAzureVmSize,
    ICommanderFrontendClient,
} from '@scrapoxy/common';


@Component({
    selector: `connector-${CONNECTOR_AZURE_TYPE}`,
    templateUrl: 'connector.component.html',
})
export class ConnectorAzureComponent implements IConnectorComponent, OnInit {
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

    locations: IAzureLocation[] = [];

    vmSizes: IAzureVmSize[] = [];

    readonly subForm: FormGroup;

    processingLocations = false;

    processingVmSizes = false;

    constructor(
        @Inject(CommanderFrontendClientService)
        private readonly commander: ICommanderFrontendClient,
        fb: FormBuilder,
        private readonly toastsService: ToastsService
    ) {
        this.subForm = fb.group({
            location: [
                void 0, Validators.required,
            ],
            port: [
                void 0,
                [
                    Validators.required, Validators.min(1024), Validators.max(65535),
                ],
            ],
            resourceGroupName: [
                void 0, Validators.required,
            ],
            vmSize: [
                void 0, Validators.required,
            ],
            storageAccountType: [
                void 0, Validators.required,
            ],
            prefix: [
                void 0, Validators.required,
            ],
            imageResourceGroupName: [
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
                location: AZURE_DEFAULT_LOCATION,
                port: 3128,
                resourceGroupName: `${SCRAPOXY_DATACENTER_PREFIX}_rg`,
                vmSize: AZURE_DEFAULT_VM_SIZE,
                storageAccountType: AZURE_DEFAULT_STORAGE_ACCOUNT_TYPE,
                prefix: 'spx',
                imageResourceGroupName: `${SCRAPOXY_DATACENTER_PREFIX}_image_rg`,
            });
        }

        this.processingLocations = true;

        try {
            this.locations = await this.commander.queryCredential(
                this.projectId,
                this.credentialId,
                {
                    type: EAzureQueryCredential.Locations,
                }
            )
                .then((locations: IAzureLocation[]) => locations.sort((
                    a, b
                ) => a.name.localeCompare(b.name)));

            await this.updateVmSize(this.subForm.value.location);
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Connector Azure',
                err.message
            );
        } finally {
            this.processingLocations = false;
        }
    }

    async locationChanged(): Promise<void> {
        const location = this.subForm.value.location;

        if (location) {
            await this.updateVmSize(location);
        } else {
            await this.updateVmSize();
        }
    }

    private async updateVmSize(location?: string): Promise<void> {
        if (location) {
            this.processingVmSizes = true;

            try {
                const parameters: IAzureQueryVmSizes = {
                    location,
                };

                this.vmSizes = await this.commander.queryCredential(
                    this.projectId,
                    this.credentialId,
                    {
                        type: EAzureQueryCredential.VmSizes,
                        parameters,
                    }
                )
                    .then((vmSizes: IAzureVmSize[]) => vmSizes.sort((
                        a, b
                    )=> a.name.localeCompare(b.name)));
            } catch (err: any) {
                console.error(err);

                this.toastsService.error(
                    'Connector Azure',
                    err.message
                );
            } finally {
                this.processingVmSizes = false;
            }
        } else {
            this.vmSizes = [];
        }
    }
}
