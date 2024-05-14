import {
    Injectable,
    Type,
} from '@angular/core';
import { CONNECTOR_NETNUT_TYPE } from '@scrapoxy/common';
import {
    ConnectorprovidersService,
    EConnectorType,
} from '@scrapoxy/frontend-sdk';
import { ConnectorNetnutComponent } from './connector/connector.component';
import { CredentialNetnutComponent } from './credential/credential.component';
import type {
    IConnectorComponent,
    IConnectorConfig,
    IConnectorFactory,
    ICredentialComponent,
    IInstallComponent,
} from '@scrapoxy/frontend-sdk';


@Injectable()
export class ConnectorNetnutFactory implements IConnectorFactory {
    readonly type = CONNECTOR_NETNUT_TYPE;

   readonly config: IConnectorConfig = {
       name: 'NetNut',
       description: 'NetNut provides DC, ISP, Residential and Mobiles. With NetNut, transform any websites data into accurate and comprehensive structured data.',
       coupon: null,
       defaultCredentialName: 'NetNut Credential',
       defaultConnectorName: 'NetNut Connector',
       url: 'https://netnut.io?ref=ymzmmmu',
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
       return CredentialNetnutComponent;
   }

   getConnectorComponent(): Type<IConnectorComponent> {
       return ConnectorNetnutComponent;
   }

   getInstallComponent(): Type<IInstallComponent> {
       throw new Error('Not implemented');
   }
}
