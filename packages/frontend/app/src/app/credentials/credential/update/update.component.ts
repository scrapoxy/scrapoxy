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
import {
    CommanderFrontendClientService,
    ConfirmService,
    ConnectorprovidersService,
    ProjectCurrentService,
    ToastsService,
} from '@scrapoxy/frontend-sdk';
import type { OnInit } from '@angular/core';
import type {
    ICommanderFrontendClient,
    ICredentialData,
    ICredentialToUpdate,
} from '@scrapoxy/common';
import type { IHasModification } from '@scrapoxy/frontend-sdk';


@Component({
    templateUrl: './update.component.html',
})
export class CredentialUpdateComponent implements OnInit, IHasModification {
    @ViewChild(
        'dform',
        {
            read: ViewContainerRef,
        }
    ) dform: ViewContainerRef;

    credential: ICredentialData | undefined = void 0;

    form: FormGroup;

    processingUpdate = false;

    processingRemove = false;

    projectId: string;

    projectName = '';

    private credentialId: string;

    constructor(
        private readonly changeDetectorRef: ChangeDetectorRef,
        private readonly connectorproviders: ConnectorprovidersService,
        @Inject(CommanderFrontendClientService)
        private readonly commander: ICommanderFrontendClient,
        private readonly confirmService: ConfirmService,
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
        this.credentialId = this.route.snapshot.params.credentialId;

        try {
            this.credential = await this.commander.getCredentialById(
                this.projectId,
                this.credentialId
            );

            this.changeDetectorRef.detectChanges();

            const factory = this.connectorproviders.getFactory(this.credential.type);
            const componentRef = this.dform.createComponent(factory.getCredentialComponent());
            componentRef.instance.form = this.form;
            componentRef.instance.projectId = this.projectId;
            componentRef.instance.credentialId = this.credentialId;
            componentRef.instance.createMode = false;

            this.changeDetectorRef.detectChanges();

            await Promise.resolve();
            this.form.patchValue(this.credential);
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Credential Update',
                err.message
            );
        }
    }

    isModified(): boolean {
        return !this.form.pristine;
    }

    async update(): Promise<void> {
        this.processingUpdate = true;

        const credentialToUpdate: ICredentialToUpdate = this.form.value;

        try {
            const credential = await this.commander.updateCredential(
                this.projectId,
                this.credentialId,
                credentialToUpdate
            );

            this.form.markAsPristine();

            this.toastsService.success(
                'Credential',
                `Credential "${credential.name}" updated.`
            );

            await this.router.navigate([
                '/projects', this.projectId, 'credentials',
            ]);
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Credential Update',
                err.message
            );
        } finally {
            this.processingUpdate = false;
        }
    }

    async removeWithConfirm(): Promise<void> {
        const accept = await this.confirmService.confirm(
            'Remove Credential',
            `Do you want to remove credential "${this.credential!.name}" ?`
        );

        if (!accept) {
            return;
        }

        await this.remove();
    }

    private async remove(): Promise<void> {
        this.processingRemove = true;

        try {
            await this.commander.removeCredential(
                this.projectId,
                this.credentialId
            );
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Credential Update',
                err.message
            );
        } finally {
            this.processingRemove = false;
        }
    }
}
