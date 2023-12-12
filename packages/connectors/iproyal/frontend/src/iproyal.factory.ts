import {
    Injectable,
    Type,
} from '@angular/core';
import { CONNECTOR_IPROYAL_TYPE } from '@scrapoxy/connector-iproyal-sdk';
import {
    ConnectorprovidersService,
    EConnectorFactoryGroup,
} from '@scrapoxy/frontend-sdk';
import { ConnectorIproyalComponent } from './connector/connector.component';
import { CredentialIproyalComponent } from './credential/credential.component';
import type {
    IConnectorComponent,
    IConnectorConfig,
    IConnectorFactory,
    ICredentialComponent,
    IInstallComponent,
} from '@scrapoxy/frontend-sdk';


@Injectable()
export class ConnectorIproyalFactory implements IConnectorFactory {
    readonly type = CONNECTOR_IPROYAL_TYPE;

   readonly config: IConnectorConfig = {
       name: 'IPRoyal',
       description: 'IPRoyal is a proxy provider that offers a versatile selection of different proxies. These include top-end residential proxies, datacenter proxies, and even niche-specific sneaker proxies',
       url: 'https://iproyal.com',
       group: EConnectorFactoryGroup.ProxiesService,
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
       return CredentialIproyalComponent;
   }

   getConnectorComponent(): Type<IConnectorComponent> {
       return ConnectorIproyalComponent;
   }

   getInstallComponent(): Type<IInstallComponent> {
       throw new Error('Not implemented');
   }
}
