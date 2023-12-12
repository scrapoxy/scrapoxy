import {
    Injectable,
    Type,
} from '@angular/core';
import { CONNECTOR_DIGITALOCEAN_TYPE } from '@scrapoxy/connector-digitalocean-sdk';
import {
    ConnectorprovidersService,
    EConnectorFactoryGroup,
} from '@scrapoxy/frontend-sdk';
import { ConnectorDigitaloceanComponent } from './connector/connector.component';
import { CredentialDigitaloceanComponent } from './credential/credential.component';
import { InstallDigitaloceanComponent } from './install/install.component';
import type {
    IConnectorComponent,
    IConnectorConfig,
    IConnectorFactory,
    ICredentialComponent,
    IInstallComponent,
} from '@scrapoxy/frontend-sdk';


@Injectable()
export class ConnectorDigitaloceanFactory implements IConnectorFactory {
    readonly type = CONNECTOR_DIGITALOCEAN_TYPE;

    readonly config: IConnectorConfig = {
        name: 'Digital Ocean',
        description: 'Digital Ocean is an US multinational cloud provider. In 2023, Digital Ocean has 15 data centers in 9 regions.',
        url: 'https://www.digitalocean.com',
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
        return CredentialDigitaloceanComponent;
    }

    getConnectorComponent(): Type<IConnectorComponent> {
        return ConnectorDigitaloceanComponent;
    }

    getInstallComponent(): Type<IInstallComponent> {
        return InstallDigitaloceanComponent;
    }
}
