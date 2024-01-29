import { Injectable } from '@nestjs/common';
import { CONNECTOR_FREEPROXIES_TYPE } from '@scrapoxy/common';
import { ConnectorFreeproxiesService } from './freeproxies.service';
import { CommanderRefreshClientService } from '../../commander-client';
import { TRANSPORT_PROXY_TYPE } from '../../transports';
import { ConnectorprovidersService } from '../providers.service';
import type {
    IConnectorConfig,
    IConnectorFactory,
    IConnectorService,
} from '../providers.interface';
import type {
    IConnectorListProxies,
    IConnectorToRefresh,
    ITaskToCreate,
} from '@scrapoxy/common';


@Injectable()
export class ConnectorFreeproxiesFactory implements IConnectorFactory {
    readonly type = CONNECTOR_FREEPROXIES_TYPE;

    readonly config: IConnectorConfig = {
        refreshDelay: 10000,
        transportType: TRANSPORT_PROXY_TYPE,
        useCertificate: false,
    };

    constructor(connectorproviders: ConnectorprovidersService) {
        connectorproviders.register(this);
    }

    async validateCredentialConfig(): Promise<void> {
        // Nothing to validate
    }

    async validateCredentialCallback(): Promise<any> {
        throw new Error('Not implemented');
    }

    async validateConnectorConfig(): Promise<void> {
        // Nothing to validate
    }

    async validateInstallConfig(): Promise<void> {
        // Nothing to validate
    }

    async buildConnectorService(
        connector: IConnectorToRefresh,
        commander: CommanderRefreshClientService
    ): Promise<IConnectorService> {
        return new ConnectorFreeproxiesService(
            connector,
            commander
        );
    }

    async buildInstallCommand(): Promise<ITaskToCreate> {
        throw new Error('Not implemented');
    }

    async buildUninstallCommand(): Promise<ITaskToCreate> {
        throw new Error('Not implemented');
    }

    async validateInstallCommand(): Promise<void> {
        // Nothing to install
    }

    async queryCredential(): Promise<any> {
        throw new Error('Not implemented');
    }

    async listAllProxies(): Promise<IConnectorListProxies> {
        throw new Error('Not implemented');
    }
}
