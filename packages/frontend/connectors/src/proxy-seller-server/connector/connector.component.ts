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
    CONNECTOR_PROXY_SELLER_SERVER_TYPE,
    EProxySellerNetworkType,
    EProxySellerServerQueryCredential,
} from '@scrapoxy/common';
import {
    CommanderFrontendClientService,

    ToastsService,
} from '@scrapoxy/frontend-sdk';
import type { OnInit } from '@angular/core';
import type {
    ICommanderFrontendClient,
    IConnectorProxySellerServerQueryType,
} from '@scrapoxy/common';
import type { IConnectorComponent } from '@scrapoxy/frontend-sdk';


@Component({
    selector: `connector-${CONNECTOR_PROXY_SELLER_SERVER_TYPE}`,
    templateUrl: 'connector.component.html',
})
export class ConnectorProxySellerServerComponent implements IConnectorComponent, OnInit {
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

    EProxySellerNetworkType = EProxySellerNetworkType;

    countries: string[] = [];

    readonly subForm: FormGroup;

    processingCountries = false;

    constructor(
        @Inject(CommanderFrontendClientService)
        private readonly commander: ICommanderFrontendClient,
        fb: FormBuilder,
        private readonly toastsService: ToastsService
    ) {
        this.subForm = fb.group({
            networkType: [
                void 0, Validators.required,
            ],
            country: [
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
                networkType: 'all',
                country: 'all',
            });
        }

        await Promise.resolve();

        await this.networkTypeChanged();
    }

    async networkTypeChanged(): Promise<void> {
        const networkType = this.subForm.value.networkType;

        await this.updateCountries(networkType);
    }

    private async updateCountries(networkType: EProxySellerNetworkType): Promise<void> {
        if (networkType) {
            this.processingCountries = true;

            try {
                const parameters: IConnectorProxySellerServerQueryType = {
                    networkType,
                };

                this.countries = await this.commander.queryCredential(
                    this.projectId,
                    this.credentialId,
                    {
                        type: EProxySellerServerQueryCredential.Countries,
                        parameters,
                    }
                )
                    .then((countries: string[]) => countries.sort());
            } catch (err: any) {
                console.error(err);

                this.toastsService.error(
                    'Connector Proxy Seller Server',
                    err.message
                );
            } finally {
                this.processingCountries = false;
            }
        } else {
            this.countries = [];
        }
    }
}
