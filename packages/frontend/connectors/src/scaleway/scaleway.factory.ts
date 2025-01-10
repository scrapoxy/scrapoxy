import {
    Injectable,
    Type,
} from '@angular/core';
import { CONNECTOR_SCALEWAY_TYPE } from '@scrapoxy/common';
import {
    ConnectorprovidersService,
    EConnectorType,
} from '@scrapoxy/frontend-sdk';
import { ConnectorScalewayComponent } from './connector/connector.component';
import { CredentialScalewayComponent } from './credential/credential.component';
import { InstallScalewayComponent } from './install/install.component';
import type {
    IConnectorComponent,
    IConnectorConfig,
    IConnectorFactory,
    ICredentialComponent,
    IInstallComponent,
} from '@scrapoxy/frontend-sdk';


@Injectable()
export class ConnectorScalewayFactory implements IConnectorFactory {
    readonly type = CONNECTOR_SCALEWAY_TYPE;

    readonly config: IConnectorConfig = {
        name: 'Scaleway',
        description: 'Scaleway is a French cloud computing provider that offers on-demand infrastructure solutions. In 2023, Scaleway operates 7 data centers in 3 regions across Europe.',
        coupon: null,
        defaultCredentialName: 'Scaleway Credential',
        defaultConnectorName: 'Scaleway Connector',
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
