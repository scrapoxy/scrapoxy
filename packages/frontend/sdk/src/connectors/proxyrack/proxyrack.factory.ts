import {
    Injectable,
    Type,
} from '@angular/core';
import { CONNECTOR_PROXYRACK_TYPE } from '@scrapoxy/common';
import { ConnectorProxyrackComponent } from './connector/connector.component';
import { CredentialProxyrackComponent } from './credential/credential.component';
import { EConnectorType } from '../providers.interface';
import { ConnectorprovidersService } from '../providers.service';
import type {
    IConnectorComponent,
    IConnectorConfig,
    IConnectorFactory,
    ICredentialComponent,
    IInstallComponent,
} from '../providers.interface';


@Injectable()
export class ConnectorProxyrackFactory implements IConnectorFactory {
    readonly type = CONNECTOR_PROXYRACK_TYPE;

    readonly config: IConnectorConfig = {
        name: 'Proxyrack',
        description: 'Proxyrack is an online platform that provides diverse and rotating residential, datacenter, and mobile proxies.',
        url: 'https://proxyrack.com',
        type: EConnectorType.DynamicIP,
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
        return CredentialProxyrackComponent;
    }

    getConnectorComponent(): Type<IConnectorComponent> {
        return ConnectorProxyrackComponent;
    }

    getInstallComponent(): Type<IInstallComponent> {
        throw new Error('Not implemented');
    }
}
