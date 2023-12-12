import {
    Component,
    Inject,
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
    ProjectCurrentService,
    ToastsService,
} from '@scrapoxy/frontend-sdk';
import type { OnInit } from '@angular/core';
import type {
    ICommanderFrontendClient,
    IConnectorData,
} from '@scrapoxy/common';
import type { IHasModification } from '@scrapoxy/frontend-sdk';


@Component({
    templateUrl: './scale.component.html',
})
export class ConnectorScaleComponent implements OnInit, IHasModification {
    connector: IConnectorData | undefined = void 0;

    connectorId: string;

    form: FormGroup;

    projectId: string;

    projectName = '';

    processing = false;

    constructor(
        @Inject(CommanderFrontendClientService)
        private readonly commander: ICommanderFrontendClient,
        fb: FormBuilder,
        projectCurrentService: ProjectCurrentService,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly toastsService: ToastsService
    ) {
        this.form = fb.group({
            proxiesMax: [
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
        this.connectorId = this.route.snapshot.params.connectorId;

        try {
            this.connector = await this.commander.getConnectorById(
                this.projectId,
                this.connectorId
            );

            this.form.patchValue({
                proxiesMax: this.connector.proxiesMax,
            });
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Connector Scale',
                err.message
            );
        }
    }

    isModified(): boolean {
        return !this.form.pristine;
    }

    async update(): Promise<void> {
        const proxiesMax = parseInt(
            this.form.value.proxiesMax,
            10
        );

        this.processing = true;

        try {
            await this.commander.scaleConnector(
                this.projectId,
                this.connectorId,
                proxiesMax
            );

            this.form.markAsPristine();

            // Toast already done in project-layout.component.ts

            await this.router.navigate([
                '/projects', this.projectId, 'connectors',
            ]);
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Connector Scale',
                err.message
            );
        } finally {
            this.processing = false;
        }
    }
}
