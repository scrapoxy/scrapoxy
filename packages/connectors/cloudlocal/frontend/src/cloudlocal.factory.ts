import {
    Injectable,
    Type,
} from '@angular/core';
import { CONNECTOR_CLOUDLOCAL_TYPE } from '@scrapoxy/connector-cloudlocal-sdk';
import {
    ConnectorprovidersService,
    EConnectorFactoryGroup,
} from '@scrapoxy/frontend-sdk';
import { ConnectorCloudlocalComponent } from './connector/connector.component';
import { CredentialCloudlocalComponent } from './credential/credential.component';
import { InstallCloudlocalComponent } from './install/install.component';
import type {
    IConnectorComponent,
    IConnectorConfig,
    IConnectorFactory,
    ICredentialComponent,
    IInstallComponent,
} from '@scrapoxy/frontend-sdk';


@Injectable()
export class ConnectorCloudlocalFactory implements IConnectorFactory {
    readonly type = CONNECTOR_CLOUDLOCAL_TYPE;

    readonly config: IConnectorConfig = {
        name: 'Local cloud',
        description: 'Local cloud is test cloud for Scrapoxy internal use.',
        url: 'https://scrapoxy.io',
        group: EConnectorFactoryGroup.CloudProvider,
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
        return CredentialCloudlocalComponent;
    }

    getConnectorComponent(): Type<IConnectorComponent> {
        return ConnectorCloudlocalComponent;
    }

    getInstallComponent(): Type<IInstallComponent> {
        return InstallCloudlocalComponent;
    }
}
