import {
    Injectable,
    Type,
} from '@angular/core';
import { CONNECTOR_RAYOBYTE_TYPE } from '@scrapoxy/connector-rayobyte-sdk';
import {
    ConnectorprovidersService,
    EConnectorType,
} from '@scrapoxy/frontend-sdk';
import { ConnectorRayobyteComponent } from './connector/connector.component';
import { CredentialRayobyteComponent } from './credential/credential.component';
import type {
    IConnectorComponent,
    IConnectorConfig,
    IConnectorFactory,
    ICredentialComponent,
    IInstallComponent,
} from '@scrapoxy/frontend-sdk';


@Injectable()
export class ConnectorRayobyteFactory implements IConnectorFactory {
    readonly type = CONNECTOR_RAYOBYTE_TYPE;

    readonly config: IConnectorConfig = {
        name: 'Rayobyte',
        description: 'Rayobyte is an US platform that provides diverse and rotating residential, datacenter, and mobile proxies.',
        url: 'https://rayobyte.com',
        type: EConnectorType.StaticIp,
        canInstall: false,
        canUninstall: false,
        useCertificate: false,
        canReplaceProxy: true,
    };

    constructor(connectorproviders: ConnectorprovidersService) {
        connectorproviders.register(this);
    }

    init() {
        // Nothing
    }

    getCredentialComponent(): Type<ICredentialComponent> {
        return CredentialRayobyteComponent;
    }

    getConnectorComponent(): Type<IConnectorComponent> {
        return ConnectorRayobyteComponent;
    }

    getInstallComponent(): Type<IInstallComponent> {
        throw new Error('Not implemented');
    }
}
