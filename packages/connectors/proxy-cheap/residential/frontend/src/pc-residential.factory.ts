import {
    Injectable,
    Type,
} from '@angular/core';
import { CONNECTOR_PROXY_CHEAP_RESIDENTIAL_TYPE } from '@scrapoxy/connector-proxy-cheap-residential-sdk';
import {
    ConnectorprovidersService,
    EConnectorType,
} from '@scrapoxy/frontend-sdk';
import { ConnectorProxyCheapResidentialComponent } from './connector/connector.component';
import { CredentialProxyCheapResidentialComponent } from './credential/credential.component';
import type {
    IConnectorComponent,
    IConnectorConfig,
    IConnectorFactory,
    ICredentialComponent,
    IInstallComponent,
} from '@scrapoxy/frontend-sdk';


@Injectable()
export class ConnectorProxyCheapResidentialFactory implements IConnectorFactory {
    readonly type = CONNECTOR_PROXY_CHEAP_RESIDENTIAL_TYPE;

   readonly config: IConnectorConfig = {
       name: 'Proxy-Cheap Residential',
       description: 'Proxy-Cheap offers enterprise-level proxies for novices and professionals. They provide affordable solutions for customers to obtain data and circumvent restrictions while operating at scale.',
       url: 'https://proxy-cheap.com',
       type: EConnectorType.DynamicIP,
       canInstall: false,
       canUninstall: false,
       useCertificate: false,
       canReplaceProxy: false,
   };

   constructor(connectorproviders: ConnectorprovidersService) {
       connectorproviders.register(this);
   }

   init() {
       // Nothing
   }

   getCredentialComponent(): Type<ICredentialComponent> {
       return CredentialProxyCheapResidentialComponent;
   }

   getConnectorComponent(): Type<IConnectorComponent> {
       return ConnectorProxyCheapResidentialComponent;
   }

   getInstallComponent(): Type<IInstallComponent> {
       throw new Error('Not implemented');
   }
}
