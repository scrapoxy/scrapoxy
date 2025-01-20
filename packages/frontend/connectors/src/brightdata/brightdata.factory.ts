import {
    Injectable,
    Type,
} from '@angular/core';
import { CONNECTOR_BRIGHTDATA_TYPE } from '@scrapoxy/common';
import {
    ConnectorprovidersService,
    EConnectorType,
} from '@scrapoxy/frontend-sdk';
import { ConnectorBrightdataComponent } from './connector/connector.component';
import { CredentialBrightdataComponent } from './credential/credential.component';
import type {
    IConnectorComponent,
    IConnectorConfig,
    IConnectorFactory,
    ICredentialComponent,
    IInstallComponent,
} from '@scrapoxy/frontend-sdk';


@Injectable()
export class ConnectorBrightdataFactory implements IConnectorFactory {
    readonly type = CONNECTOR_BRIGHTDATA_TYPE;

   readonly config: IConnectorConfig = {
       name: 'BrightData',
       description: 'Award-winning proxy networks, AI-powered web scrapers, and business-ready datasets for download. Welcome to the internet’s most trusted web data platform.',
       coupon: null,
       defaultCredentialName: 'BrightData Credential',
       defaultConnectorName: 'BrightData Connector',
       url: 'https://get.brightdata.com/khkl3keb25ld',
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
       return CredentialBrightdataComponent;
   }

   getConnectorComponent(): Type<IConnectorComponent> {
       return ConnectorBrightdataComponent;
   }

   getInstallComponent(): Type<IInstallComponent> {
       throw new Error('Not implemented');
   }
}
