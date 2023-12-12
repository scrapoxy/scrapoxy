import {
    ChangeDetectorRef,
    Component,
    Inject,
    ViewChild,
    ViewContainerRef,
} from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
    ConnectorUpdatedEvent,
    ONE_YEAR_IN_MS,
} from '@scrapoxy/common';
import {
    CommanderFrontendClientService,
    ConfirmService,
    ConnectorprovidersService,
    EventsService,
    ProjectCurrentService,
    ToastsService,
} from '@scrapoxy/frontend-sdk';
import { Subscription } from 'rxjs';
import type {
    OnDestroy,
    OnInit,
} from '@angular/core';
import type {
    ICommanderFrontendClient,
    IConnectorData,
    IConnectorToUpdate,
    IConnectorView,
    ICredentialView,
} from '@scrapoxy/common';
import type {
    IConnectorConfig,
    IHasModification,
} from '@scrapoxy/frontend-sdk';


@Component({
    templateUrl: './update.component.html',
})
export class ConnectorUpdateComponent implements OnInit, OnDestroy, IHasModification {
    @ViewChild(
        'dform',
        {
            read: ViewContainerRef,
        }
    ) dform: ViewContainerRef;

    connector: IConnectorData | undefined = void 0;

    connectorId: string;

    connectorLoaded = false;

    credentials: ICredentialView[] = [];

    form: FormGroup;

    processingUpdate = false;

    processingValidate = false;

    processingRemove = false;

    projectId: string;

    projectName = '';

    private readonly subscription = new Subscription();

    constructor(
        private readonly changeDetectorRef: ChangeDetectorRef,
        private readonly connectorproviders: ConnectorprovidersService,
        @Inject(CommanderFrontendClientService)
        private readonly commander: ICommanderFrontendClient,
        private readonly confirmService: ConfirmService,
        private readonly events: EventsService,
        fb: FormBuilder,
        projectCurrentService: ProjectCurrentService,
        private readonly route: ActivatedRoute,
        private readonly toastsService: ToastsService
    ) {
        this.form = fb.group({
            name: [
                void 0, Validators.required,
            ],
            credentialId: [
                void 0, Validators.required,
            ],
        });

        projectCurrentService.project$.subscribe((value) => {
            this.projectName = value?.name ?? '';
        });
    }

    async ngOnInit() {
        this.projectId = this.route.snapshot.params.projectId;
        this.connectorId = this.route.snapshot.params.connectorId;

        this.subscription.add(this.events.event$.subscribe((event) => {
            if (!event) {
                return;
            }

            switch (event.id) {
                case ConnectorUpdatedEvent.id: {
                    const updated = event as ConnectorUpdatedEvent;
                    this.onConnectorUpdated(updated.connector);
                    break;
                }
            }
        }));

        try {
            this.connector = await this.commander.getConnectorById(
                this.projectId,
                this.connectorId
            );

            this.credentials = await this.commander.getAllProjectCredentials(
                this.projectId,
                this.connector.type
            );

            const credential = this.credentials.find((c) => c.id === this.connector!.credentialId) as ICredentialView;
            await this.updateConnectorType(credential);

            this.form.patchValue(this.connector);

            this.connectorLoaded = true;
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Connector Update',
                err.message
            );
        }
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    get config(): IConnectorConfig | undefined {
        if (!this.connector) {
            return;
        }

        const provider = this.connectorproviders.getFactory(this.connector.type);

        return provider.config;
    }

    isModified(): boolean {
        return !this.form.pristine;
    }

    async credentialChanged(): Promise<void> {
        const credentialId = this.form.value.credentialId;
        const credential = this.credentials.find((c) => c.id === credentialId) as ICredentialView;
        const formValue = this.form.value;
        await this.updateConnectorType(credential);

        this.form.patchValue(formValue);
    }

    async update(): Promise<void> {
        const connectorToUpdate: IConnectorToUpdate = this.form.value;

        this.processingUpdate = true;

        try {
            await this.commander.updateConnector(
                this.projectId,
                this.connectorId,
                connectorToUpdate
            );

            this.form.markAsPristine();

            // Toast already done in project-layout.component.ts
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Connector Update',
                err.message
            );
        } finally {
            this.processingUpdate = false;
        }
    }

    async validate(): Promise<void> {
        const connectorToUpdate: IConnectorToUpdate = this.form.value;

        this.processingValidate = true;

        try {
            await this.commander.updateConnector(
                this.projectId,
                this.connectorId,
                connectorToUpdate
            );

            this.form.markAsPristine();

            await this.commander.validateConnector(
                this.projectId,
                this.connectorId
            );

            this.toastsService.success(
                'Connector',
                `Connector "${this.connector!.name} "validated.`
            );
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Connector Update',
                err.message
            );
        } finally {
            this.processingValidate = false;
        }
    }

    async renewConnectorCertificateWithConfirm(): Promise<void> {
        const accept = await this
            .confirmService.confirm(
                'Renew Certificate',
                `Do you want to renew certificate ? You must rebuild the connector image!`
            );

        if (!accept) {
            return;
        }

        await this.renewConnectorCertificate();
    }

    async removeConnectorWithConfirm(): Promise<void> {
        const accept = await this
            .confirmService.confirm(
                'Remove Connector',
                `Do you want to remove connector "${this.connector!.name}" ?`
            );

        if (!accept) {
            return;
        }

        await this.removeConnector();
    }

    private async renewConnectorCertificate(): Promise<void> {
        try {
            await this.commander.renewConnectorCertificate(
                this.projectId,
                this.connectorId,
                ONE_YEAR_IN_MS
            );
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Project Update',
                'Cannot renew certificate'
            );
        }
    }

    private async removeConnector(): Promise<void> {
        this.processingRemove = true;

        try {
            await this.commander.removeConnector(
                this.projectId,
                this.connectorId
            );
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Connector Update',
                err.message
            );
        } finally {
            this.processingRemove = false;
        }
    }

    private async updateConnectorType(credential: ICredentialView): Promise<void> {
        if (!this.dform) {
            return;
        }

        this.changeDetectorRef.detectChanges();

        this.dform.clear();

        const factory = this.connectorproviders.getFactory(credential.type);
        const componentRef = this.dform.createComponent(factory.getConnectorComponent());
        componentRef.instance.form = this.form;
        componentRef.instance.projectId = this.projectId;
        componentRef.instance.connectorId = this.connectorId;
        componentRef.instance.credentialId = credential.id;
        componentRef.instance.createMode = false;

        this.changeDetectorRef.detectChanges();
    }

    private onConnectorUpdated(connector: IConnectorView) {
        if (this.projectId !== connector.projectId ||
            this.connectorId !== connector.id ||
            !this.connector) {
            return;
        }

        this.commander.getConnectorById(
            this.projectId,
            this.connectorId
        )
            .then((c) => {
                this.connector = c;
                this.form.patchValue(this.connector);
            })
            .catch((err) => {
                console.error(err);

                this.toastsService.error(
                    'Connector Update',
                    err.message
                );
            });
    }

}
