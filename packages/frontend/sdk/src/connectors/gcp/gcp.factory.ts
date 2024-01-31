import {
    Injectable,
    Type,
} from '@angular/core';
import { CONNECTOR_GCP_TYPE } from '@scrapoxy/common';
import { ConnectorGcpComponent } from './connector/connector.component';
import { CredentialGcpComponent } from './credential/credential.component';
import { InstallGcpComponent } from './install/install.component';
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
export class ConnectorGcpFactory implements IConnectorFactory {
    readonly type = CONNECTOR_GCP_TYPE;

   readonly config: IConnectorConfig = {
       name: 'Google Cloud Platform',
       description: 'Google Cloud Platform is a cloud computing services that runs on the same infrastructure that Google uses internally. In 2023, GCP has 148 data centers in 49 regions.',
       url: 'https://cloud.google.com',
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
       return CredentialGcpComponent;
   }

   getConnectorComponent(): Type<IConnectorComponent> {
       return ConnectorGcpComponent;
   }

   getInstallComponent(): Type<IInstallComponent> {
       return InstallGcpComponent;
   }
}