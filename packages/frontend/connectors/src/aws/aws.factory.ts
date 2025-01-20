import {
    Injectable,
    Type,
} from '@angular/core';
import { CONNECTOR_AWS_TYPE } from '@scrapoxy/common';
import {
    ConnectorprovidersService,
    EConnectorType,
} from '@scrapoxy/frontend-sdk';
import { ConnectorAwsComponent } from './connector/connector.component';
import { CredentialAwsComponent } from './credential/credential.component';
import { InstallAwsComponent } from './install/install.component';
import type {
    IConnectorComponent,
    IConnectorConfig,
    IConnectorFactory,
    ICredentialComponent,
    IInstallComponent,
} from '@scrapoxy/frontend-sdk';


@Injectable()
export class ConnectorAwsFactory implements IConnectorFactory {
    readonly type = CONNECTOR_AWS_TYPE;

    readonly config: IConnectorConfig = {
        name: 'Amazon Web Services',
        description: 'Amazon Web Services is a subsidiary of Amazon that provides on-demand cloud computing. In 2023, AWS has 100 data centers in 31 regions.',
        coupon: null,
        defaultCredentialName: 'AWS Credential',
        defaultConnectorName: 'AWS Connector',
        url: 'https://aws.amazon.com',
        type: EConnectorType.Datacenter,
        canInstall: true,
        canUninstall: true,
        useCertificate: true,
    };

    constructor(connectorproviders: ConnectorprovidersService) {
        connectorproviders.register(this);
    }

    init() {
        // Nothing
    }

    getCredentialComponent(): Type<ICredentialComponent> {
        return CredentialAwsComponent;
    }

    getConnectorComponent(): Type<IConnectorComponent> {
        return ConnectorAwsComponent;
    }

    getInstallComponent(): Type<IInstallComponent> {
        return InstallAwsComponent;
    }
}
