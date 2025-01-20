import {
    Injectable,
    Type,
} from '@angular/core';
import { CONNECTOR_GEONODE_TYPE } from '@scrapoxy/common';
import {
    ConnectorprovidersService,
    EConnectorType,
} from '@scrapoxy/frontend-sdk';
import { ConnectorGeonodeComponent } from './connector/connector.component';
import { CredentialGeonodeComponent } from './credential/credential.component';
import type {
    IConnectorComponent,
    IConnectorConfig,
    IConnectorFactory,
    ICredentialComponent,
    IInstallComponent,
} from '@scrapoxy/frontend-sdk';


@Injectable()
export class ConnectorGeonodeFactory implements IConnectorFactory {
    readonly type = CONNECTOR_GEONODE_TYPE;

   readonly config: IConnectorConfig = {
       name: 'Geonode',
       description: 'The Right Proxies for Your Business from Geonode. Join thousands of developers using the fastest-growing residential proxy network. Geonode\’s proxies speak for themselves.',
       coupon: null,
       defaultCredentialName: 'Geonode Credential',
       defaultConnectorName: 'Geonode Connector',
       url: 'https://geonode.pxf.io/c/5392682/2020638/25070?trafsrc=impact',
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
       return CredentialGeonodeComponent;
   }

   getConnectorComponent(): Type<IConnectorComponent> {
       return ConnectorGeonodeComponent;
   }

   getInstallComponent(): Type<IInstallComponent> {
       throw new Error('Not implemented');
   }
}
