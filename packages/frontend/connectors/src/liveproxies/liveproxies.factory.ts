import {
    Injectable,
    Type,
} from '@angular/core';
import { CONNECTOR_LIVEPROXIES_TYPE } from '@scrapoxy/common';
import {
    ConnectorprovidersService,
    EConnectorType,
} from '@scrapoxy/frontend-sdk';
import { ConnectorLiveproxiesComponent } from './connector/connector.component';
import { CredentialLiveproxiesComponent } from './credential/credential.component';
import type {
    IConnectorComponent,
    IConnectorConfig,
    IConnectorFactory,
    ICredentialComponent,
    IInstallComponent,
} from '@scrapoxy/frontend-sdk';


@Injectable()
export class ConnectorLiveproxiesFactory implements IConnectorFactory {
    readonly type = CONNECTOR_LIVEPROXIES_TYPE;

   readonly config: IConnectorConfig = {
       name: 'Live Proxies',
       description: 'Live Proxies provides top notch private residential proxies tailored to businesses and individuals.',
       coupon: null,
       defaultCredentialName: 'Live Proxies Credential',
       defaultConnectorName: 'Live Proxies Connector',
       url: 'https://liveproxies.io/aff/pv5i8f8',
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
       return CredentialLiveproxiesComponent;
   }

   getConnectorComponent(): Type<IConnectorComponent> {
       return ConnectorLiveproxiesComponent;
   }

   getInstallComponent(): Type<IInstallComponent> {
       throw new Error('Not implemented');
   }
}
