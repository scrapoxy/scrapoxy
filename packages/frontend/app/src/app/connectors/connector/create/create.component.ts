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
import {
    ActivatedRoute,
    Router,
} from '@angular/router';
import { ONE_YEAR_IN_MS } from '@scrapoxy/common';
import {
    CommanderFrontendClientService,
    ConnectorprovidersService,
    ProjectCurrentService,
    ToastsService,
} from '@scrapoxy/frontend-sdk';
import type { OnInit } from '@angular/core';
import type {
    ICommanderFrontendClient,
    IConnectorToCreate,
    ICredentialView,
} from '@scrapoxy/common';
import type { IHasModification } from '@scrapoxy/frontend-sdk';


@Component({
    templateUrl: './create.component.html',
})
export class ConnectorCreateComponent implements OnInit, IHasModification {
    @ViewChild(
        'dform',
        {
            read: ViewContainerRef,
        }
    ) dform: ViewContainerRef;

    credentials: ICredentialView[] = [];

    form: FormGroup;

    processing = false;

    projectId: string;

    projectName = '';

    constructor(
        private readonly changeDetectorRef: ChangeDetectorRef,
        private readonly connectorproviders: ConnectorprovidersService,
        @Inject(CommanderFrontendClientService)
        private readonly commander: ICommanderFrontendClient,
        fb: FormBuilder,
        projectCurrentService: ProjectCurrentService,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly toastsService: ToastsService
    ) {
        this.form = fb.group({
            name: [
                void 0, Validators.required,
            ],
            credentialId: [
                void 0, Validators.required,
            ],
            proxiesMax: [
                void 0,
                [
                    Validators.required, Validators.min(1),
                ],
            ],
            certificateDurationInMs: [
                // Value hidden and set to 1 year
                void 0,
                [
                    Validators.required, Validators.min(1),
                ],
            ],
        });

        projectCurrentService.project$.subscribe((value) => {
            this.projectName = value?.name ?? '';
        });
    }

    async ngOnInit(): Promise<void> {
        this.projectId = this.route.snapshot.params.projectId;

        try {
            this.credentials = await this.commander.getAllProjectCredentials(
                this.projectId,
                null
            )
                .then((credentials) => credentials.sort((
                    a, b
                ) => a.name.localeCompare(b.name)));

            if (this.credentials.length <= 0) {
                await this.router.navigate([
                    '/projects',
                    this.projectId,
                    'credentials',
                    'create',
                ]);

                return;
            }

            const connectorToCreate: IConnectorToCreate = {
                name: 'My connector',
                credentialId: null as any,
                proxiesMax: 1,
                config: void 0,
                certificateDurationInMs: ONE_YEAR_IN_MS,
            };
            this.form.patchValue(connectorToCreate);
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Connector Create',
                err.message
            );
        }
    }

    isModified(): boolean {
        return !this.form.pristine;
    }

    credentialChanged() {
        const credentialId = this.form.value.credentialId;

        if (credentialId) {
            const credential = this.credentials.find((c) => c.id === credentialId) as ICredentialView;
            this.updateConnectorType(credential);
        } else {
            this.updateConnectorType();
        }
    }

    async create(): Promise<void> {
        const connectorToCreate: IConnectorToCreate = this.form.value;

        this.processing = true;

        try {
            await this.commander.createConnector(
                this.projectId,
                connectorToCreate
            );

            this.form.markAsPristine();

            // Toast already done in project-layout.component.ts
            await this.router.navigate([
                '/projects', this.projectId, 'connectors',
            ]);
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Connector Create',
                err.message
            );
        } finally {
            this.processing = false;
        }
    }

    private updateConnectorType(credential?: ICredentialView) {
        if (!this.dform) {
            return;
        }

        this.dform.clear();

        if (!credential) {
            return;
        }

        this.changeDetectorRef.detectChanges();

        const factory = this.connectorproviders.getFactory(credential.type);
        const componentRef = this.dform.createComponent(factory.getConnectorComponent());
        componentRef.instance.form = this.form;
        componentRef.instance.projectId = this.projectId;
        componentRef.instance.connectorId = void 0;
        componentRef.instance.credentialId = credential.id;
        componentRef.instance.createMode = true;
    }
}
