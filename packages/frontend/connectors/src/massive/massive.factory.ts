import {
    Injectable,
    Type,
} from '@angular/core';
import { CONNECTOR_MASSIVE_TYPE } from '@scrapoxy/common';
import {
    ConnectorprovidersService,
    EConnectorType,
} from '@scrapoxy/frontend-sdk';
import { ConnectorMassiveComponent } from './connector/connector.component';
import { CredentialMassiveComponent } from './credential/credential.component';
import type {
    IConnectorComponent,
    IConnectorConfig,
    IConnectorFactory,
    ICredentialComponent,
    IInstallComponent,
} from '@scrapoxy/frontend-sdk';


@Injectable()
export class ConnectorMassiveFactory implements IConnectorFactory {
    readonly type = CONNECTOR_MASSIVE_TYPE;

   readonly config: IConnectorConfig = {
       name: 'Massive',
       description: 'Massive offers a robust residential proxy network featuring full global coverage, with an extensive top-tier performance IP pool, competitive pricing, and 100% ethically sourced residential IPs.',
       coupon: null,
       defaultCredentialName: 'Massive Credential',
       defaultConnectorName: 'Massive Connector',
       url: 'https://partners.joinmassive.com/plans?ref=oguwmwr',
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
       return CredentialMassiveComponent;
   }

   getConnectorComponent(): Type<IConnectorComponent> {
       return ConnectorMassiveComponent;
   }

   getInstallComponent(): Type<IInstallComponent> {
       throw new Error('Not implemented');
   }
}
