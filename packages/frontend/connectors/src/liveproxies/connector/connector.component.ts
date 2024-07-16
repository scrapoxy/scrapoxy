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
    CONNECTOR_LIVEPROXIES_TYPE,
    ELiveproxiesQueryCredential,
} from '@scrapoxy/common';
import {
    CommanderFrontendClientService,
    ToastsService,
} from '@scrapoxy/frontend-sdk';
import type { OnInit } from '@angular/core';
import type {
    ICommanderFrontendClient,
    ILiveproxiesPlanB2C,
} from '@scrapoxy/common';
import type { IConnectorComponent } from '@scrapoxy/frontend-sdk';


@Component({
    selector: `connector-${CONNECTOR_LIVEPROXIES_TYPE}`,
    templateUrl: 'connector.component.html',
})
export class ConnectorLiveproxiesComponent implements IConnectorComponent, OnInit {
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

    plans: ILiveproxiesPlanB2C[] = [];

    processingPlans = false;

    readonly subForm: FormGroup;

    constructor(
        @Inject(CommanderFrontendClientService)
        private readonly commander: ICommanderFrontendClient,
        fb: FormBuilder,
        private readonly toastsService: ToastsService
    ) {
        this.subForm = fb.group({
            packageId: [
                void 0, Validators.required,
            ],
            productName: [
                void 0, Validators.required,
            ],
            country: [
                void 0, Validators.required,
            ],
        });
    }

    get isEnterprise(): boolean {
        return this.subForm.value.productName === 'ENTERPRISE';
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
                country: 'all',
            });
        }

        this.processingPlans = true;

        try {
            this.plans = await this.commander.queryCredential(
                this.projectId,
                this.credentialId,
                {
                    type: ELiveproxiesQueryCredential.Plans,
                }
            )
                .then((plans: ILiveproxiesPlanB2C[]) => plans.sort((
                    a, b
                ) => a.productName.localeCompare(b.productName)));
        } catch (err: any) {
            console.error(err);

            this.toastsService.error(
                'Connector Liveproxies',
                err.message
            );
        } finally {
            this.processingPlans = false;
        }
    }

    async packageIdChanged(): Promise<void> {
        const packageId = this.subForm.value.packageId;

        if (packageId) {
            const plan = this.plans.find((p) => p.packageId === packageId);

            if (plan) {
                this.subForm.patchValue({
                    productName: plan.productName,
                });
            } else {
                this.subForm.patchValue({
                    productName: void 0,
                });
            }
        } else {
            this.subForm.patchValue({
                productName: void 0,
            });
        }
    }
}
