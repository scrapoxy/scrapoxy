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
    CONNECTOR_OVH_TYPE,
    EOvhQueryCredential,
    OVH_DEFAULT_REGION,
} from '@scrapoxy/connector-ovh-sdk';
import {
    CommanderFrontendClientService,
    ToastsService,
} from '@scrapoxy/frontend-sdk';
import type { OnInit } from '@angular/core';
import type { ICommanderFrontendClient } from '@scrapoxy/common';
import type {
    IOvhFlavorView,
    IOvhProjectView,
    IOvhQueryFlavors,
    IOvhQueryRegions,
    IOvhQuerySnapshots,
    IOvhRegionView,
    IOvhSnapshotView,
} from '@scrapoxy/connector-ovh-sdk';
import type { IConnectorComponent } from '@scrapoxy/frontend-sdk';


@Component({
    selector: `connector-${CONNECTOR_OVH_TYPE}`,
    templateUrl: 'connector.component.html',
})
export class ConnectorOvhComponent implements IConnectorComponent, OnInit {
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

    projects: IOvhProjectView[] = [];

    regions: IOvhRegionView[] = [];

    flavors: IOvhFlavorView[] = [];

    snapshots: IOvhSnapshotView[] = [];

    readonly subForm: FormGroup;

    processingProjects = false;

    processingRegions = false;

    processingFlavors = false;

    processingSnapshots = false;

    constructor(
        @Inject(CommanderFrontendClientService)
        private readonly commander: ICommanderFrontendClient,
        fb: FormBuilder,
        private readonly toastsService: ToastsService
    ) {
        this.subForm = fb.group({
            projectId: [
                void 0, Validators.required,
            ],
            region: [
                void 0, Validators.required,
            ],
            port: [
                void 0,
                [
                    Validators.required, Validators.min(1024), Validators.max(65535),
                ],
            ],
            flavorId: [
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
                region: OVH_DEFAULT_REGION,
                port: 3128,
                snapshotId: '',
                tag: 'spx',
            });
        }

        await this.updateProjects();

        const projectId = this.subForm.value.projectId;
        await this.updateRegions(projectId);
    }

    async projectChanged(): Promise<void> {
        const projectId = this.subForm.value.projectId;

        if (projectId) {
            await this.updateRegions(projectId);
        } else {
            await this.updateRegions();
        }
    }

    async regionChanged(): Promise<void> {
        const projectId = this.subForm.value.projectId;
        const region = this.subForm.value.region;

        if (projectId) {
            await Promise.all([
                this.updateFlavors(
                    projectId,
                    region
                ),
                this.updateSnapshots(
                    projectId,
                    region
                ),
            ]);
        } else {
            await Promise.all([
                this.updateFlavors(), this.updateSnapshots(),
            ]);
        }
    }

    private async updateProjects(): Promise<void> {
        this.processingProjects = true;

        try {
            this.projects = await this.commander.queryCredential(
                this.projectId,
                this.credentialId,
                {
                    type: EOvhQueryCredential.Projects,
                }
            )
                .then((projects: IOvhProjectView[]) =>
                    projects.sort((
                        a, b
                    ) => a.name.localeCompare(b.name)));

            if (this.projects.length > 0 &&
                !this.subForm.value.projectId) {
                this.subForm.patchValue({
                    ...this.subForm.value,
                    projectId: this.projects[ 0 ].id,
                });
            }
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Connector OVH',
                err.message
            );
        } finally {
            this.processingProjects = false;
        }
    }

    private async updateRegions(projectId?: string): Promise<void> {
        if (projectId) {
            this.processingRegions = true;

            try {
                const parameters: IOvhQueryRegions = {
                    projectId,
                };

                this.regions = await this.commander.queryCredential(
                    this.projectId,
                    this.credentialId,
                    {
                        type: EOvhQueryCredential.Regions,
                        parameters,
                    }
                )
                    .then((regions: IOvhRegionView[]) =>
                        regions.sort((
                            a, b
                        ) => a.name.localeCompare(b.name)));

                if (this.regions.length > 0 &&
                    !this.subForm.value.region) {
                    this.subForm.patchValue({
                        ...this.subForm.value,
                        region: this.regions[ 0 ].name,
                    });
                }
            } catch (err: any) {
                console.error(err);

                this.toastsService.error(
                    'Connector OVH',
                    err.message
                );
            } finally {
                this.processingRegions = false;
            }
        } else {
            this.regions = [];
        }

        await this.regionChanged();
    }

    private async updateFlavors(
        projectId?: string, region?: string
    ): Promise<void> {
        if (projectId && region) {
            this.processingFlavors = true;

            try {
                const parameters: IOvhQueryFlavors = {
                    projectId,
                    region,
                };

                this.flavors = await this.commander.queryCredential(
                    this.projectId,
                    this.credentialId,
                    {
                        type: EOvhQueryCredential.Flavors,
                        parameters,
                    }
                )
                    .then((flavors: IOvhFlavorView[]) =>
                        flavors.sort((
                            a, b
                        ) => a.name.localeCompare(b.name)));

                if (this.flavors.length > 0 &&
                    !this.subForm.value.flavorId) {
                    this.subForm.patchValue({
                        ...this.subForm.value,
                        flavorId: this.flavors[ 0 ].id,
                    });
                }
            } catch (err: any) {
                console.error(err);

                this.toastsService.error(
                    'Connector OVH',
                    err.message
                );
            } finally {
                this.processingFlavors = false;
            }
        } else {
            this.flavors = [];
        }
    }

    private async updateSnapshots(
        projectId?: string, region?: string
    ): Promise<void> {
        if (projectId && region) {
            this.processingSnapshots = true;

            try {
                const parameters: IOvhQuerySnapshots = {
                    projectId,
                    region,
                };

                this.snapshots = await this.commander.queryCredential(
                    this.projectId,
                    this.credentialId,
                    {
                        type: EOvhQueryCredential.Snapshots,
                        parameters,
                    }
                )
                    .then((snapshots: IOvhSnapshotView[]) =>
                        snapshots.sort((
                            a, b
                        ) => a.name.localeCompare(b.name)));

                if (this.snapshots.length > 0 &&
                    !this.subForm.value.snapshotId) {
                    this.subForm.patchValue({
                        ...this.subForm.value,
                        snapshotId: this.snapshots[ 0 ].id,
                    });
                }
            } catch (err: any) {
                console.error(err);

                this.toastsService.error(
                    'Connector OVH',
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
