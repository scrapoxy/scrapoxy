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
} from '@angular/forms';
import {
    ActivatedRoute,
    Router,
} from '@angular/router';
import {
    CommanderFrontendClientService,
    ConnectorprovidersService,
    ProjectCurrentService,
    ToastsService,
} from '@scrapoxy/frontend-sdk';
import type { OnInit } from '@angular/core';
import type {
    ICommanderFrontendClient,
    IConnectorData,
    IConnectorToInstall,
} from '@scrapoxy/common';
import type { IHasModification } from '@scrapoxy/frontend-sdk';


@Component({
    templateUrl: './install.component.html',
})
export class ConnectorInstallComponent implements OnInit, IHasModification {
    @ViewChild(
        'dform',
        {
            read: ViewContainerRef,
        }
    ) dform: ViewContainerRef;

    connector: IConnectorData | undefined = void 0;

    connectorId: string;

    form: FormGroup;

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
        this.form = fb.group({});

        projectCurrentService.project$.subscribe((value) => {
            this.projectName = value?.name ?? '';
        });
    }

    async ngOnInit(): Promise<void> {
        this.projectId = this.route.snapshot.params.projectId;

        this.connectorId = this.route.snapshot.params.connectorId;

        try {
            this.connector = await this.commander.getConnectorById(
                this.projectId,
                this.connectorId
            );

            this.changeDetectorRef.detectChanges();

            const factory = this.connectorproviders.getFactory(this.connector.type);
            const componentRef = this.dform.createComponent(factory.getInstallComponent());
            componentRef.instance.form = this.form;

            this.changeDetectorRef.detectChanges();

            this.form.patchValue(this.connector);
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Connector Install',
                err.message
            );
        }
    }

    isModified(): boolean {
        return !this.form.pristine;
    }

    async install(): Promise<void> {
        const connectorToInstall: IConnectorToInstall = this.form.value;

        try {
            const task = await this.commander.installConnector(
                this.projectId,
                this.connectorId,
                connectorToInstall
            );

            this.form.markAsPristine();

            // Toast already done in project-layout.component.ts

            await this.router.navigate([
                '/projects',
                this.projectId,
                'tasks',
                task.id,
            ]);
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Connector Install',
                err.message
            );
        }
    }
}
