import { Injectable } from '@nestjs/common';
import {
    ConnectorprovidersService,
    validate,
} from '@scrapoxy/backend-sdk';
import { CONNECTOR_NETNUT_TYPE } from '@scrapoxy/common';
import { ConnectorNetnutService } from './netnut.service';
import {
    schemaConfig,
    schemaCredential,
} from './netnut.validation';
import type {
    IConnectorNetnutConfig,
    IConnectorNetnutCredential,
} from './netnut.interface';
import type {
    IConnectorConfig,
    IConnectorFactory,
    IConnectorService,
} from '@scrapoxy/backend-sdk';
import type {
    IConnectorListProxies,
    IConnectorToRefresh,
    ITaskToCreate,
} from '@scrapoxy/common';


@Injectable()
export class ConnectorNetnutFactory implements IConnectorFactory {
    readonly type = CONNECTOR_NETNUT_TYPE;

    readonly config: IConnectorConfig = {
        refreshDelay: 10000,
        useCertificate: false,
    };

    constructor(connectorproviders: ConnectorprovidersService) {
        connectorproviders.register(this);
    }

    async validateCredentialConfig(config: IConnectorNetnutCredential): Promise<void> {
        await validate(
            schemaCredential,
            config
        );
    }

    async validateCredentialCallback(): Promise<any> {
        throw new Error('Not implemented');
    }

    async validateConnectorConfig(
        credentialConfig: IConnectorNetnutCredential,
        connectorConfig: IConnectorNetnutConfig
    ): Promise<void> {
        await validate(
            schemaConfig,
            connectorConfig
        );
    }

    async validateInstallConfig(): Promise<void> {
        // Nothing to validate
    }

    async buildConnectorService(connector: IConnectorToRefresh): Promise<IConnectorService> {
        return new ConnectorNetnutService(connector.connectorConfig);
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
