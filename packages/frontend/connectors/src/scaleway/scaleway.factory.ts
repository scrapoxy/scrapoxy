import {
    Injectable,
    Type,
} from '@angular/core';
import { CONNECTOR_SCALEWAY_TYPE } from '@scrapoxy/common';
import type {
    IConnectorComponent,
    IConnectorConfig,
    IConnectorFactory,
    ICredentialComponent,
    IInstallComponent,
} from '@scrapoxy/frontend-sdk';
import {
    ConnectorprovidersService,
    EConnectorType,
} from '@scrapoxy/frontend-sdk';
import { ConnectorScalewayComponent } from './connector/connector.component';
import { CredentialScalewayComponent } from './credential/credential.component';
import { InstallScalewayComponent } from './install/install.component';


@Injectable()
export class ConnectorScalewayFactory implements IConnectorFactory {
    readonly type = CONNECTOR_SCALEWAY_TYPE;

    readonly config: IConnectorConfig = {
        name: 'Scaleway',
        description: 'Scaleway.',
        coupon: null,
        defaultCredentialName: 'SCALEWAY Credential',
        defaultConnectorName: 'SCALEWAY Connector',
        url: 'https://www.scaleway.com/en/',
        type: EConnectorType.Datacenter,
        canInstall: true,
        canUninstall: true,
        canReplaceProxy: false,
        useCertificate: true,
    };

    constructor(connectorproviders: ConnectorprovidersService) {
        connectorproviders.register(this);
    }

    init() {
        // Nothing
    }

    getCredentialComponent(): Type<ICredentialComponent> {
        return CredentialScalewayComponent;
    }

    getConnectorComponent(): Type<IConnectorComponent> {
        return ConnectorScalewayComponent;
    }

    getInstallComponent(): Type<IInstallComponent> {
        return InstallScalewayComponent;
    }
}
