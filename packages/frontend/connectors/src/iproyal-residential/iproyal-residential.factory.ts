import {
    Injectable,
    Type,
} from '@angular/core';
import { CONNECTOR_IPROYAL_RESIDENTIAL_TYPE } from '@scrapoxy/common';
import {
    ConnectorprovidersService,
    EConnectorType,
} from '@scrapoxy/frontend-sdk';
import { ConnectorIproyalResidentialComponent } from './connector/connector.component';
import { CredentialIproyalResidentialComponent } from './credential/credential.component';
import type {
    IConnectorComponent,
    IConnectorConfig,
    IConnectorFactory,
    ICredentialComponent,
    IInstallComponent,
} from '@scrapoxy/frontend-sdk';


@Injectable()
export class ConnectorIproyalResidentialFactory implements IConnectorFactory {
    readonly type = CONNECTOR_IPROYAL_RESIDENTIAL_TYPE;

   readonly config: IConnectorConfig = {
       name: 'IPRoyal Residential',
       description: 'IPRoyal is a proxy provider that offers a versatile selection of different proxies. These include top-end residential proxies, datacenter proxies, and even niche-specific sneaker proxies',
       url: 'https://iproyal.com',
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
       return CredentialIproyalResidentialComponent;
   }

   getConnectorComponent(): Type<IConnectorComponent> {
       return ConnectorIproyalResidentialComponent;
   }

   getInstallComponent(): Type<IInstallComponent> {
       throw new Error('Not implemented');
   }
}
