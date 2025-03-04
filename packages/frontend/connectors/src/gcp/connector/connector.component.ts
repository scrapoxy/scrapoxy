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
    CONNECTOR_GCP_TYPE,
    EGcpQueryCredential,
    GCP_DEFAULT_MACHINE_TYPE,
    GCP_DEFAULT_ZONE,
    SCRAPOXY_DATACENTER_PREFIX,
} from '@scrapoxy/common';
import {
    CommanderFrontendClientService,
    ToastsService,
} from '@scrapoxy/frontend-sdk';
import type { OnInit } from '@angular/core';
import type {
    ICommanderFrontendClient,
    IGcpQueryMachineTypes,
} from '@scrapoxy/common';
import type { IConnectorComponent } from '@scrapoxy/frontend-sdk';


@Component({
    selector: `connector-${CONNECTOR_GCP_TYPE}`,
    templateUrl: 'connector.component.html',
})
export class ConnectorGcpComponent implements IConnectorComponent, OnInit {
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

    zones: string[] = [];

    machineTypes: string[] = [];

    readonly subForm: FormGroup;

    processingZones = false;

    processingMachineTypes = false;

    constructor(
        @Inject(CommanderFrontendClientService)
        private readonly commander: ICommanderFrontendClient,
        fb: FormBuilder,
        private readonly toastsService: ToastsService
    ) {
        this.subForm = fb.group({
            zone: [
                void 0, Validators.required,
            ],
            port: [
                void 0,
                [
                    Validators.required, Validators.min(1024), Validators.max(65535),
                ],
            ],
            machineType: [
                void 0, Validators.required,
            ],
            networkName: [
                void 0, Validators.required,
            ],
            label: [
                void 0, Validators.required,
            ],
            firewallName: [
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
                zone: GCP_DEFAULT_ZONE,
                port: 3128,
                machineType: GCP_DEFAULT_MACHINE_TYPE,
                networkName: 'default',
                label: 'spx',
                firewallName: `${SCRAPOXY_DATACENTER_PREFIX}-fw`,
            });
        }

        this.processingZones = true;

        try {
            this.zones = await this.commander.queryCredential(
                this.projectId,
                this.credentialId,
                {
                    type: EGcpQueryCredential.Zones,
                }
            )
                .then((zones: string[]) => zones.sort());

            await this.updateMachineTypes(this.subForm.value.zone);
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Connector GCP',
                err.message
            );
        } finally {
            this.processingZones = false;
        }
    }

    async zoneChanged(): Promise<void> {
        const zone = this.subForm.value.zone;

        if (zone) {
            await this.updateMachineTypes(zone);
        } else {
            await this.updateMachineTypes();
        }
    }

    private async updateMachineTypes(zone?: string): Promise<void> {
        if (zone) {
            this.processingMachineTypes = true;

            try {
                const parameters: IGcpQueryMachineTypes = {
                    zone,
                };

                this.machineTypes = await this.commander.queryCredential(
                    this.projectId,
                    this.credentialId,
                    {
                        type: EGcpQueryCredential.MachineTypes,
                        parameters,
                    }
                )
                    .then((machineTypes: string[]) => machineTypes.sort());
            } catch (err: any) {
                console.error(err);

                this.toastsService.error(
                    'Connector GCP',
                    err.message
                );
            } finally {
                this.processingMachineTypes = false;
            }
        } else {
            this.machineTypes = [];
        }
    }
}
