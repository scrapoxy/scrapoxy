import {
    Injectable,
    Type,
} from '@angular/core';
import { CONNECTOR_OVH_TYPE } from '@scrapoxy/common';
import { ConnectorOvhComponent } from './connector/connector.component';
import { CredentialOvhComponent } from './credential/credential.component';
import { InstallOvhComponent } from './install/install.component';
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
export class ConnectorOvhFactory implements IConnectorFactory {
    readonly type = CONNECTOR_OVH_TYPE;

   readonly config: IConnectorConfig = {
       name: 'OVH Cloud',
       description: 'OVH Cloud is a french cloud computing service created by OVH. In 2023, OVH Cloud has 34 data centers in 8 regions.',
       url: 'https://www.ovhcloud.com',
       type: EConnectorType.Datacenter,
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
