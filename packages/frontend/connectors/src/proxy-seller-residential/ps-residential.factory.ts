import {
    Injectable,
    Type,
} from '@angular/core';
import { CONNECTOR_PROXY_SELLER_RESIDENTIAL_TYPE } from '@scrapoxy/common';
import {
    ConnectorprovidersService,
    EConnectorType,
} from '@scrapoxy/frontend-sdk';
import { ConnectorProxySellerResidentialComponent } from './connector/connector.component';
import { CredentialProxySellerResidentialComponent } from './credential/credential.component';
import type {
    IConnectorComponent,
    IConnectorConfig,
    IConnectorFactory,
    ICredentialComponent,
    IInstallComponent,
} from '@scrapoxy/frontend-sdk';


@Injectable()
export class ConnectorProxySellerResidentialFactory implements IConnectorFactory {
    readonly type = CONNECTOR_PROXY_SELLER_RESIDENTIAL_TYPE;

   readonly config: IConnectorConfig = {
       name: 'Proxy-Seller Residential',
       description: 'Proxy-Seller\'s residential proxy service provides business users with a premium, affordable solution to access data, ensuring top-tier quality and performance for enterprise needs.',
       coupon: {
           name: 'SCRAPOXY',
           description: '(20% off all plans)',
       },
       defaultCredentialName: 'Proxy-Seller Residential Credential',
       defaultConnectorName: 'Proxy-Seller Residential Connector',
       url: 'https://proxy-seller.com/?partner=GR930FP5IOO78P',
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
       return CredentialProxySellerResidentialComponent;
   }

   getConnectorComponent(): Type<IConnectorComponent> {
       return ConnectorProxySellerResidentialComponent;
   }

   getInstallComponent(): Type<IInstallComponent> {
       throw new Error('Not implemented');
   }
}
