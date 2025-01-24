import {
    Injectable,
    Type,
} from '@angular/core';
import { CONNECTOR_PROXIDIZE_TYPE } from '@scrapoxy/common';
import {
    ConnectorprovidersService,
    EConnectorType,
} from '@scrapoxy/frontend-sdk';
import { ConnectorProxidizeComponent } from './connector/connector.component';
import { CredentialProxidizeComponent } from './credential/credential.component';
import type {
    IConnectorComponent,
    IConnectorConfig,
    IConnectorFactory,
    ICredentialComponent,
    IInstallComponent,
} from '@scrapoxy/frontend-sdk';


@Injectable()
export class ConnectorProxidizeFactory implements IConnectorFactory {
    readonly type = CONNECTOR_PROXIDIZE_TYPE;

   readonly config: IConnectorConfig = {
       name: 'Proxidize',
       description: 'Proxidize is a revolutionary mobile proxy network creation and management platform built on mobile devices allowing businesses to create ultra-powerful proxies that are incomparable to anything else.',
       coupon: null,
       defaultCredentialName: 'Proxidize Credential',
       defaultConnectorName: 'Proxidize Connector',
       url: 'https://scrapoxy.io/l/proxidize',
       type: EConnectorType.Hardware,
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
       return CredentialProxidizeComponent;
   }

   getConnectorComponent(): Type<IConnectorComponent> {
       return ConnectorProxidizeComponent;
   }

   getInstallComponent(): Type<IInstallComponent> {
       throw new Error('Not implemented');
   }
}
