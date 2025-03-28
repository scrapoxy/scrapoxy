import {
    Injectable,
    Type,
} from '@angular/core';
import { CONNECTOR_PROXY_LOCAL_TYPE } from '@scrapoxy/common';
import {
    ConnectorprovidersService,
    EConnectorType,
} from '@scrapoxy/frontend-sdk';
import { ConnectorProxyLocalComponent } from './connector/connector.component';
import { CredentialProxyLocalComponent } from './credential/credential.component';
import type {
    IConnectorComponent,
    IConnectorConfig,
    IConnectorFactory,
    ICredentialComponent,
    IInstallComponent,
} from '@scrapoxy/frontend-sdk';


@Injectable()
export class ConnectorProxyLocalFactory implements IConnectorFactory {
    readonly type = CONNECTOR_PROXY_LOCAL_TYPE;

    readonly config: IConnectorConfig = {
        name: 'Local proxies API',
        description: 'Local proxies API is test proxies service for Scrapoxy internal use.',
        coupon: null,
        defaultCredentialName: 'Local proxies Credential',
        defaultConnectorName: 'Local proxies Connector',
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
        return CredentialProxyLocalComponent;
    }

    getConnectorComponent(): Type<IConnectorComponent> {
        return ConnectorProxyLocalComponent;
    }

    getInstallComponent(): Type<IInstallComponent> {
        throw new Error('Not implemented');
    }
}
