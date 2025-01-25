import {
    Injectable,
    Type,
} from '@angular/core';
import { CONNECTOR_EVOMI_TYPE } from '@scrapoxy/common';
import {
    ConnectorprovidersService,
    EConnectorType,
} from '@scrapoxy/frontend-sdk';
import { ConnectorEvomiComponent } from './connector/connector.component';
import { CredentialEvomiComponent } from './credential/credential.component';
import type {
    IConnectorComponent,
    IConnectorConfig,
    IConnectorFactory,
    ICredentialComponent,
    IInstallComponent,
} from '@scrapoxy/frontend-sdk';


@Injectable()
export class ConnectorEvomiFactory implements IConnectorFactory {
    readonly type = CONNECTOR_EVOMI_TYPE;

   readonly config: IConnectorConfig = {
       name: 'Evomi',
       description: 'Evomi is the most affordable in the market! High-speed, reliable data collection without sacrificing quality. Perfect for efficient web scraping and seamless data intelligence, free from blocks and CAPTCHAs.',
       coupon: null,
       defaultCredentialName: 'Evomi Credential',
       defaultConnectorName: 'Evomi Connector',
       url: 'https://scrapoxy.io/l/evomi',
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
       return CredentialEvomiComponent;
   }

   getConnectorComponent(): Type<IConnectorComponent> {
       return ConnectorEvomiComponent;
   }

   getInstallComponent(): Type<IInstallComponent> {
       throw new Error('Not implemented');
   }
}
