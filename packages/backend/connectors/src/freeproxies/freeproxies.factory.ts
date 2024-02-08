import { Injectable } from '@nestjs/common';
import {
    CommanderRefreshClientService,
    ConnectorprovidersService,
    TRANSPORT_PROXY_TYPE,
    validate,
} from '@scrapoxy/backend-sdk';
import { CONNECTOR_FREEPROXIES_TYPE } from '@scrapoxy/common';
import { ValidationError } from 'joi';
import { ConnectorFreeproxiesService } from './freeproxies.service';
import { schemaConfig } from './freeproxies.validation';
import type {
    IConnectorConfig,
    IConnectorFactory,
    IConnectorService,
} from '@scrapoxy/backend-sdk';
import type {
    IConnectorFreeproxyConfig,
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

    async validateConnectorConfig(
        credentialConfig: any,
        connectorConfig: IConnectorFreeproxyConfig
    ): Promise<void> {
        await validate(
            schemaConfig,
            connectorConfig
        );

        if (connectorConfig.freeproxiesTimeoutUnreachable.enabled) {
            if (connectorConfig.freeproxiesTimeoutUnreachable.value < connectorConfig.freeproxiesTimeoutDisconnected) {
                throw new ValidationError(
                    'Timeout unreachable must be greater than disconnected',
                    [],
                    'freeproxiesTimeoutUnreachable.value'
                );
            }
        }
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
