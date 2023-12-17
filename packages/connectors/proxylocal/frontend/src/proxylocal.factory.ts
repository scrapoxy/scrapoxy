import {
    Injectable,
    Type,
} from '@angular/core';
import { CONNECTOR_PROXYLOCAL_TYPE } from '@scrapoxy/connector-proxylocal-sdk';
import {
    ConnectorprovidersService,
    EConnectorFactoryGroup,
} from '@scrapoxy/frontend-sdk';
import { ConnectorProxylocalComponent } from './connector/connector.component';
import { CredentialProxylocalComponent } from './credential/credential.component';
import type {
    IConnectorComponent,
    IConnectorConfig,
    IConnectorFactory,
    ICredentialComponent,
    IInstallComponent,
} from '@scrapoxy/frontend-sdk';


@Injectable()
export class ConnectorProxylocalFactory implements IConnectorFactory {
    readonly type = CONNECTOR_PROXYLOCAL_TYPE;

    readonly config: IConnectorConfig = {
        name: 'Local proxies API',
        description: 'Local proxies API is test proxies service for Scrapoxy internal use.',
        url: 'https://scrapoxy.io',
        group: EConnectorFactoryGroup.ProxiesServiceDynamic,
        canInstall: false,
        canUninstall: false,
        canReplaceProxy: false,
        useCertificate: false,
    };

    constructor(connectorproviders: ConnectorprovidersService) {
        connectorproviders.register(this);
    }

    init() {
        // Nothing
    }

    getCredentialComponent(): Type<ICredentialComponent> {
        return CredentialProxylocalComponent;
    }

    getConnectorComponent(): Type<IConnectorComponent> {
        return ConnectorProxylocalComponent;
    }

    getInstallComponent(): Type<IInstallComponent> {
        throw new Error('Not implemented');
    }
}
