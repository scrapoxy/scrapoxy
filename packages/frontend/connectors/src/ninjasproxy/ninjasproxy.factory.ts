import {
    Injectable,
    Type,
} from '@angular/core';
import { CONNECTOR_NINJASPROXY_TYPE } from '@scrapoxy/common';
import {
    ConnectorprovidersService,
    EConnectorType,
} from '@scrapoxy/frontend-sdk';
import { ConnectorNinjasproxyComponent } from './connector/connector.component';
import { CredentialNinjasproxyComponent } from './credential/credential.component';
import type {
    IConnectorComponent,
    IConnectorConfig,
    IConnectorFactory,
    ICredentialComponent,
    IInstallComponent,
} from '@scrapoxy/frontend-sdk';


@Injectable()
export class ConnectorNinjasproxyFactory implements IConnectorFactory {
    readonly type = CONNECTOR_NINJASPROXY_TYPE;

   readonly config: IConnectorConfig = {
       name: 'Ninjas proxy',
       description: 'Ninjas proxy is a provider that offers static and residential proxies',
       url: 'https://ninjasproxy.com/',
       type: EConnectorType.StaticIp,
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
       return CredentialNinjasproxyComponent;
   }

   getConnectorComponent(): Type<IConnectorComponent> {
       return ConnectorNinjasproxyComponent;
   }

   getInstallComponent(): Type<IInstallComponent> {
       throw new Error('Not implemented');
   }
}
