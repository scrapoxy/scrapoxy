import {
    Injectable,
    Type,
} from '@angular/core';
import { CONNECTOR_DATACENTER_LOCAL_TYPE } from '@scrapoxy/common';
import {
    ConnectorprovidersService,
    EConnectorType,
} from '@scrapoxy/frontend-sdk';
import { ConnectorDatacenterLocalComponent } from './connector/connector.component';
import { CredentialDatacenterLocalComponent } from './credential/credential.component';
import { InstallDatacenterLocalComponent } from './install/install.component';
import type {
    IConnectorComponent,
    IConnectorConfig,
    IConnectorFactory,
    ICredentialComponent,
    IInstallComponent,
} from '@scrapoxy/frontend-sdk';


@Injectable()
export class ConnectorDatacenterLocalFactory implements IConnectorFactory {
    readonly type = CONNECTOR_DATACENTER_LOCAL_TYPE;

    readonly config: IConnectorConfig = {
        name: 'Local datacenter',
        description: 'Local datacenter is test datacenter for Scrapoxy internal use.',
        url: 'https://scrapoxy.io',
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
        return CredentialDatacenterLocalComponent;
    }

    getConnectorComponent(): Type<IConnectorComponent> {
        return ConnectorDatacenterLocalComponent;
    }

    getInstallComponent(): Type<IInstallComponent> {
        return InstallDatacenterLocalComponent;
    }
}
