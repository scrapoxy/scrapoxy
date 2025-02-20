import {
    Injectable,
    Type,
} from '@angular/core';
import { CONNECTOR_TENCENT_TYPE } from '@scrapoxy/common';
import {
    ConnectorprovidersService,
    EConnectorType,
} from '@scrapoxy/frontend-sdk';
import { ConnectorTencentComponent } from './connector/connector.component';
import { CredentialTencentComponent } from './credential/credential.component';
import type {
    IConnectorComponent,
    IConnectorConfig,
    IConnectorFactory,
    ICredentialComponent,
    IInstallComponent,
} from '@scrapoxy/frontend-sdk';


@Injectable()
export class ConnectorTencentFactory implements IConnectorFactory {
    readonly type = CONNECTOR_TENCENT_TYPE;

    readonly config: IConnectorConfig = {
        name: 'Tencent',
        description: 'Tencent Cloud is a Chinese cloud computing provider that offers on-demand infrastructure solutions. In 2023, Tencent Cloud operates over 70 availability zones in 26 regions across the globe.',
        coupon: null,
        defaultCredentialName: 'Tencent Credential',
        defaultConnectorName: 'Tencent Connector',
        url: 'https://scrapoxy.io/l/tencent',
        type: EConnectorType.Datacenter,
        canInstall: false,
        canUninstall: false,
        useCertificate: true,
    };

    constructor(connectorproviders: ConnectorprovidersService) {
        connectorproviders.register(this);
    }

    init() {
        // Nothing
    }

    getCredentialComponent(): Type<ICredentialComponent> {
        return CredentialTencentComponent;
    }

    getConnectorComponent(): Type<IConnectorComponent> {
        return ConnectorTencentComponent;
    }

    getInstallComponent(): Type<IInstallComponent> {
        throw new Error('Not implemented');
    }
}
