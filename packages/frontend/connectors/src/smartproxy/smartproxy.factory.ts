import {
    Injectable,
    Type,
} from '@angular/core';
import { CONNECTOR_SMARTPROXY_TYPE } from '@scrapoxy/common';
import {
    ConnectorprovidersService,
    EConnectorType,
} from '@scrapoxy/frontend-sdk';
import { ConnectorSmartproxyComponent } from './connector/connector.component';
import { CredentialSmartproxyComponent } from './credential/credential.component';
import type {
    IConnectorComponent,
    IConnectorConfig,
    IConnectorFactory,
    ICredentialComponent,
    IInstallComponent,
} from '@scrapoxy/frontend-sdk';


@Injectable()
export class ConnectorSmartproxyFactory implements IConnectorFactory {
    readonly type = CONNECTOR_SMARTPROXY_TYPE;

   readonly config: IConnectorConfig = {
       name: 'Smartproxy',
       description: 'Access 65M+ global IPs via Smartproxy – award-winning proxy service provider with efficient data extraction and multi-accounting infrastructure. Proven by Proxyway.',
       coupon: null,
       defaultCredentialName: 'Smartproxy Credential',
       defaultConnectorName: 'Smartproxy Connector',
       url: 'https://scrapoxy.io/l/smartproxy',
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
       return CredentialSmartproxyComponent;
   }

   getConnectorComponent(): Type<IConnectorComponent> {
       return ConnectorSmartproxyComponent;
   }

   getInstallComponent(): Type<IInstallComponent> {
       throw new Error('Not implemented');
   }
}
