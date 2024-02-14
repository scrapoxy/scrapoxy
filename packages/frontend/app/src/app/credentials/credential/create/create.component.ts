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
import { getFreename } from '@scrapoxy/common';
import {
    CommanderFrontendClientService,
    ConnectorprovidersService,
    ProjectCurrentService,
    ToastsService,
} from '@scrapoxy/frontend-sdk';
import type { OnInit } from '@angular/core';
import type {
    ICommanderFrontendClient,
    ICredentialToCreate,
} from '@scrapoxy/common';
import type { IHasModification } from '@scrapoxy/frontend-sdk';


@Component({
    templateUrl: './create.component.html',
})
export class CredentialCreateComponent implements OnInit, IHasModification {
    @ViewChild(
        'dform',
        {
            read: ViewContainerRef,
        }
    ) dform: ViewContainerRef;

    connectorType: string;

    form: FormGroup;

    processing = false;

    projectId: string;

    projectName = '';

    constructor(
        private readonly changeDetectorRef: ChangeDetectorRef,
        private readonly connectorproviders: ConnectorprovidersService,
        @Inject(CommanderFrontendClientService)
        private readonly commander: ICommanderFrontendClient,
        projectCurrentService: ProjectCurrentService,
        fb: FormBuilder,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly toastsService: ToastsService
    ) {
        this.form = fb.group({
            name: [
                void 0, Validators.required,
            ],
            config: [
                void 0, Validators.required,
            ],
        });

        projectCurrentService.project$.subscribe((value) => {
            this.projectName = value?.name ?? '';
        });
    }

    async ngOnInit(): Promise<void> {
        this.projectId = this.route.snapshot.params.projectId;
        this.connectorType = this.route.snapshot.params.connectorType;

        this.changeDetectorRef.detectChanges();

        const factory = this.connectorproviders.getFactory(this.connectorType);
        const componentRef = this.dform.createComponent(factory.getCredentialComponent());
        componentRef.instance.form = this.form;
        componentRef.instance.projectId = this.projectId;
        componentRef.instance.credentialId = void 0;
        componentRef.instance.createMode = true;

        this.changeDetectorRef.detectChanges();

        try {
            const existings = await this.commander.getAllProjectCredentialsNames(this.projectId);
            const name = getFreename(
                factory.config.defaultCredentialName,
                existings
            );

            this.form.patchValue({
                name,
                config: void 0,
            });
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Credential Create',
                err.message
            );
        }
    }

    isModified(): boolean {
        return !this.form.pristine;
    }

    async create(): Promise<void> {
        this.processing = true;

        const credentialToCreate: ICredentialToCreate = this.form.value;
        credentialToCreate.type = this.connectorType;

        try {
            const credential = await this.commander.createCredential(
                this.projectId,
                credentialToCreate
            );

            this.form.markAsPristine();

            this.toastsService.success(
                'Credential',
                `Credential "${credential.name}" created.`
            );

            await this.router.navigate([
                '/projects',
                this.projectId,
                'connectors',
                'create',
            ]);
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Credential Create',
                err.message
            );
        } finally {
            this.processing = false;
        }
    }
}
