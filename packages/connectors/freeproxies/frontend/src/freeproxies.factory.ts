import {
    Injectable,
    Type,
} from '@angular/core';
import { CONNECTOR_FREEPROXIES_TYPE } from '@scrapoxy/connector-freeproxies-sdk';
import {
    ConnectorprovidersService,
    EConnectorFactoryGroup,
} from '@scrapoxy/frontend-sdk';
import { ConnectorFreeproxiesComponent } from './connector/connector.component';
import { CredentialFreeproxiesComponent } from './credential/credential.component';
import type {
    IConnectorComponent,
    IConnectorConfig,
    IConnectorFactory,
    ICredentialComponent,
    IInstallComponent,
} from '@scrapoxy/frontend-sdk';


@Injectable()
export class ConnectorFreeproxiesFactory implements IConnectorFactory {
    readonly type = CONNECTOR_FREEPROXIES_TYPE;

    readonly config: IConnectorConfig = {
        name: 'Free Proxies List',
        description: 'Free proxies list is a type of connector to hold a manual list of proxies.',
        url: 'https://scrapoxy.io',
        group: EConnectorFactoryGroup.Other,
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
        return CredentialFreeproxiesComponent;
    }

    getConnectorComponent(): Type<IConnectorComponent> {
        return ConnectorFreeproxiesComponent;
    }

    getInstallComponent(): Type<IInstallComponent> {
        throw new Error('Not implemented');
    }
}
