import {
    Injectable,
    Type,
} from '@angular/core';
import { CONNECTOR_ZYTE_TYPE } from '@scrapoxy/common';
import {
    ConnectorprovidersService,
    EConnectorType,
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
        name: 'Zyte Proxy Manager API',
        description: 'Zyte (formely Crawlera) is a proxies service for Data Extraction.',
        coupon: null,
        defaultCredentialName: 'Zyte Credential',
        defaultConnectorName: 'Zyte Connector',
        url: 'https://scrapoxy.io/l/zyte',
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
        return CredentialZyteComponent;
    }

    getConnectorComponent(): Type<IConnectorComponent> {
        return ConnectorZyteComponent;
    }

    getInstallComponent(): Type<IInstallComponent> {
        throw new Error('Not implemented');
    }
}
