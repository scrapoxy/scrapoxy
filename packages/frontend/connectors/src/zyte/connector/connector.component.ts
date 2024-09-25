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
    CONNECTOR_ZYTE_TYPE,
    EZyteCredentialType,
} from '@scrapoxy/common';
import {
    CommanderFrontendClientService,
    convertCodesToCountries,
    ToastsService,
} from '@scrapoxy/frontend-sdk';
import type { OnInit } from '@angular/core';
import type { ICommanderFrontendClient } from '@scrapoxy/common';
import type { IConnectorComponent } from '@scrapoxy/frontend-sdk';


const ZYTE_REGIONS = [
    'ae',
    'at',
    'au',
    'be',
    'br',
    'by',
    'ca',
    'ch',
    'cl',
    'cn',
    'de',
    'dk',
    'es',
    'fi',
    'fr',
    'gb',
    'gr',
    'hk',
    'id',
    'ie',
    'il',
    'in',
    'it',
    'jp',
    'kr',
    'mx',
    'my',
    'ng',
    'nl',
    'ph',
    'pl',
    'pt',
    'ro',
    'ru',
    'se',
    'sg',
    'th',
    'tr',
    'tw',
    'us',
    'za',
];


@Component({
    selector: `connector-${CONNECTOR_ZYTE_TYPE}`,
    templateUrl: 'connector.component.html',
})
export class ConnectorZyteComponent implements IConnectorComponent, OnInit {
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

    readonly subForm: FormGroup;

    countries = convertCodesToCountries(ZYTE_REGIONS);

    constructor(
        @Inject(CommanderFrontendClientService)
        private readonly commander: ICommanderFrontendClient,
        fb: FormBuilder,
        private readonly toastsService: ToastsService
    ) {
        this.subForm = fb.group({
            region: [
                void 0, Validators.required,
            ],
            apiUrl: [
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
            try {
                const credentialType = await this.commander.getCredentialById(
                    this.projectId,
                    this.credentialId
                )
                    .then(data => data.config.credentialType);

                switch (credentialType) {
                    case EZyteCredentialType.ZYTE_API: {
                        this.subForm.patchValue({
                            region: 'US',
                            apiUrl: 'api.zyte.com:8011',
                        });

                        break;
                    }

                    case EZyteCredentialType.SMART_PROXY_MANAGER: {
                        this.subForm.patchValue({
                            region: 'US',
                            apiUrl: 'proxy.crawlera.com:8011',
                        });

                        break;
                    }
                }
            } catch (err: any) {
                console.error(err);

                this.toastsService.error(
                    'Connector Zyte',
                    err.message
                );
            }
        }
    }
}
