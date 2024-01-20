import {
    Injectable,
    Type,
} from '@angular/core';
import { CONNECTOR_OVH_TYPE } from '@scrapoxy/connector-ovh-sdk';
import {
    ConnectorprovidersService,
    EConnectorFactoryGroup,
} from '@scrapoxy/frontend-sdk';
import { ConnectorOvhComponent } from './connector/connector.component';
import { CredentialOvhComponent } from './credential/credential.component';
import { InstallOvhComponent } from './install/install.component';
import type {
    IConnectorComponent,
    IConnectorConfig,
    IConnectorFactory,
    ICredentialComponent,
    IInstallComponent,
} from '@scrapoxy/frontend-sdk';


@Injectable()
export class ConnectorOvhFactory implements IConnectorFactory {
    readonly type = CONNECTOR_OVH_TYPE;

   readonly config: IConnectorConfig = {
       name: 'OVH Cloud',
       description: 'OVH Cloud is a french cloud computing service created by OVH. In 2023, OVH Cloud has 34 data centers in 8 regions.',
       url: 'https://www.ovhcloud.com',
       group: EConnectorFactoryGroup.DatacenterProvider,
       canInstall: true,
       canUninstall: true,
       canReplaceProxy: false,
       useCertificate: true,
   };

   constructor(connectorproviders: ConnectorprovidersService) {
       connectorproviders.register(this);
   }

   init() {
       // Nothing
   }

   getCredentialComponent(): Type<ICredentialComponent> {
       return CredentialOvhComponent;
   }

   getConnectorComponent(): Type<IConnectorComponent> {
       return ConnectorOvhComponent;
   }

   getInstallComponent(): Type<IInstallComponent> {
       return InstallOvhComponent;
   }
}
