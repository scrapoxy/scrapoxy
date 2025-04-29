import {
    Injectable,
    Type,
} from '@angular/core';
import { CONNECTOR_DECODO_TYPE } from '@scrapoxy/common';
import {
    ConnectorprovidersService,
    EConnectorType,
} from '@scrapoxy/frontend-sdk';
import { ConnectorDecodoComponent } from './connector/connector.component';
import { CredentialDecodoComponent } from './credential/credential.component';
import type {
    IConnectorComponent,
    IConnectorConfig,
    IConnectorFactory,
    ICredentialComponent,
    IInstallComponent,
} from '@scrapoxy/frontend-sdk';


@Injectable()
export class ConnectorDecodoFactory implements IConnectorFactory {
    readonly type = CONNECTOR_DECODO_TYPE;

   readonly config: IConnectorConfig = {
       name: 'Decodo',
       description: 'Access 65M+ global IPs via Decodo (formerly Smartproxy) – award-winning proxy service provider with efficient data extraction and multi-accounting infrastructure. Proven by Proxyway.',
       coupon: null,
       defaultCredentialName: 'Decodo Credential',
       defaultConnectorName: 'Decodo Connector',
       url: 'https://scrapoxy.io/l/decodo',
       type: EConnectorType.DynamicIP,
       canInstall: false,
       canUninstall: false,
       useCertificate: false,
   };

   constructor(connectorproviders: ConnectorprovidersService) {
       connectorproviders.register(this);
   }

   init() {
       // Nothing
   }

   getCredentialComponent(): Type<ICredentialComponent> {
       return CredentialDecodoComponent;
   }

   getConnectorComponent(): Type<IConnectorComponent> {
       return ConnectorDecodoComponent;
   }

   getInstallComponent(): Type<IInstallComponent> {
       throw new Error('Not implemented');
   }
}
