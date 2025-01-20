import {
    Injectable,
    Type,
} from '@angular/core';
import { CONNECTOR_NIMBLEWAY_TYPE } from '@scrapoxy/common';
import {
    ConnectorprovidersService,
    EConnectorType,
} from '@scrapoxy/frontend-sdk';
import { ConnectorNimblewayComponent } from './connector/connector.component';
import { CredentialNimblewayComponent } from './credential/credential.component';
import type {
    IConnectorComponent,
    IConnectorConfig,
    IConnectorFactory,
    ICredentialComponent,
    IInstallComponent,
} from '@scrapoxy/frontend-sdk';


@Injectable()
export class ConnectorNimblewayFactory implements IConnectorFactory {
    readonly type = CONNECTOR_NIMBLEWAY_TYPE;

    readonly config: IConnectorConfig = {
        name: 'Nimble',
        description: 'Nimble is an experience seamless data-gathering with high-performance residential proxies, optimized for superior quality and granular control.',
        coupon: null,
        defaultCredentialName: 'Nimble Credential',
        defaultConnectorName: 'Nimble Connector',
        url: 'https://tracking.nimbleway.com/SH4a',
        type: EConnectorType.DynamicIP,
        canInstall: false,
        canUninstall: false,
        useCertificate: false,
    };

    constructor(connectorproviders: ConnectorprovidersService) {
        connectorproviders.register(this);
    }

    init() {
        // Nothing
    }

    getCredentialComponent(): Type<ICredentialComponent> {
        return CredentialNimblewayComponent;
    }

    getConnectorComponent(): Type<IConnectorComponent> {
        return ConnectorNimblewayComponent;
    }

    getInstallComponent(): Type<IInstallComponent> {
        throw new Error('Not implemented');
    }
}
