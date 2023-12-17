import {
    Injectable,
    Type,
} from '@angular/core';
import { CONNECTOR_ZYTE_TYPE } from '@scrapoxy/connector-zyte-sdk';
import {
    ConnectorprovidersService,
    EConnectorFactoryGroup,
} from '@scrapoxy/frontend-sdk';
import { ConnectorZyteComponent } from './connector/connector.component';
import { CredentialZyteComponent } from './credential/credential.component';
import type {
    IConnectorComponent,
    IConnectorConfig,
    IConnectorFactory,
    ICredentialComponent,
    IInstallComponent,
} from '@scrapoxy/frontend-sdk';


@Injectable()
export class ConnectorZyteFactory implements IConnectorFactory {
    readonly type = CONNECTOR_ZYTE_TYPE;

    readonly config: IConnectorConfig = {
        name: 'Zyte Smartproxy Manager API',
        description: 'Zyte (formely Crawlera) is a proxies service for Data Extraction.',
        url: 'https://zyte.com',
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
        return CredentialZyteComponent;
    }

    getConnectorComponent(): Type<IConnectorComponent> {
        return ConnectorZyteComponent;
    }

    getInstallComponent(): Type<IInstallComponent> {
        throw new Error('Not implemented');
    }
}
