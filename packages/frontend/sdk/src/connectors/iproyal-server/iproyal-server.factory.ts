import {
    Injectable,
    Type,
} from '@angular/core';
import { CONNECTOR_IPROYAL_SERVER_TYPE } from '@scrapoxy/common';
import { ConnectorIproyalServerComponent } from './connector/connector.component';
import { CredentialIproyalServerComponent } from './credential/credential.component';
import { EConnectorType } from '../providers.interface';
import { ConnectorprovidersService } from '../providers.service';
import type {
    IConnectorComponent,
    IConnectorConfig,
    IConnectorFactory,
    ICredentialComponent,
    IInstallComponent,
} from '../providers.interface';


@Injectable()
export class ConnectorIproyalServerFactory implements IConnectorFactory {
    readonly type = CONNECTOR_IPROYAL_SERVER_TYPE;

   readonly config: IConnectorConfig = {
       name: 'IPRoyal Server',
       description: 'IPRoyal is a proxy provider that offers a versatile selection of different proxies. These include top-end residential proxies, datacenter proxies, and even niche-specific sneaker proxies',
       url: 'https://iproyal.com',
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
       return CredentialIproyalServerComponent;
   }

   getConnectorComponent(): Type<IConnectorComponent> {
       return ConnectorIproyalServerComponent;
   }

   getInstallComponent(): Type<IInstallComponent> {
       throw new Error('Not implemented');
   }
}
