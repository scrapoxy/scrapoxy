import {
    Injectable,
    Type,
} from '@angular/core';
import { CONNECTOR_PROXY_CHEAP_SERVER_TYPE } from '@scrapoxy/common';
import {
    ConnectorprovidersService,
    EConnectorType,
} from '@scrapoxy/frontend-sdk';
import { ConnectorProxyCheapServerComponent } from './connector/connector.component';
import { CredentialProxyCheapServerComponent } from './credential/credential.component';
import type {
    IConnectorComponent,
    IConnectorConfig,
    IConnectorFactory,
    ICredentialComponent,
    IInstallComponent,
} from '@scrapoxy/frontend-sdk';


@Injectable()
export class ConnectorProxyCheapServerFactory implements IConnectorFactory {
    readonly type = CONNECTOR_PROXY_CHEAP_SERVER_TYPE;

   readonly config: IConnectorConfig = {
       name: 'Proxy-Cheap Server',
       description: 'Proxy-Cheap offers enterprise-level proxies for novices and professionals. They provide affordable solutions for customers to obtain data and circumvent restrictions while operating at scale.',
       coupon: null,
       defaultCredentialName: 'Proxy-Cheap Server Credential',
       defaultConnectorName: 'Proxy-Cheap Server Connector',
       url: 'https://scrapoxy.io/l/proxy-cheap',
       type: EConnectorType.StaticIp,
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
       return CredentialProxyCheapServerComponent;
   }

   getConnectorComponent(): Type<IConnectorComponent> {
       return ConnectorProxyCheapServerComponent;
   }

   getInstallComponent(): Type<IInstallComponent> {
       throw new Error('Not implemented');
   }
}
