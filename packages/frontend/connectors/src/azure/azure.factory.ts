import {
    Injectable,
    Type,
} from '@angular/core';
import { CONNECTOR_AZURE_TYPE } from '@scrapoxy/common';
import {
    ConnectorprovidersService,
    EConnectorType,
} from '@scrapoxy/frontend-sdk';
import { ConnectorAzureComponent } from './connector/connector.component';
import { CredentialAzureComponent } from './credential/credential.component';
import type{
    IConnectorComponent,
    IConnectorConfig,
    IConnectorFactory,
    ICredentialComponent,
    IInstallComponent,
} from '@scrapoxy/frontend-sdk';


@Injectable()
export class ConnectorAzureFactory implements IConnectorFactory {
    readonly type = CONNECTOR_AZURE_TYPE;

    readonly config: IConnectorConfig = {
        name: 'Azure',
        description: 'Azure is a cloud computing service created by Microsoft. In 2023, Azure has 160 data centers in 60 regions.',
        coupon: null,
        defaultCredentialName: 'Azure Credential',
        defaultConnectorName: 'Azure Connector',
        url: 'https://scrapoxy.io/l/azure',
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
        return CredentialAzureComponent;
    }

    getConnectorComponent(): Type<IConnectorComponent> {
        return ConnectorAzureComponent;
    }

    getInstallComponent(): Type<IInstallComponent> {
        throw new Error('Not implemented');
    }
}
