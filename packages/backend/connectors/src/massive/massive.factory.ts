import { Injectable } from '@nestjs/common';
import {
    ConnectorprovidersService,
    validate,
} from '@scrapoxy/backend-sdk';
import { CONNECTOR_MASSIVE_TYPE } from '@scrapoxy/common';
import { ConnectorMassiveService } from './massive.service';
import {
    schemaConfig,
    schemaCredential,
} from './massive.validation';
import type {
    IConnectorMassiveConfig,
    IConnectorMassiveCredential,
} from './massive.interface';
import type {
    IConnectorConfig,
    IConnectorFactory,
    IConnectorService,
} from '@scrapoxy/backend-sdk';
import type {
    IConnectorToRefresh,
    ITaskToCreate,
} from '@scrapoxy/common';


@Injectable()
export class ConnectorMassiveFactory implements IConnectorFactory {
    readonly type = CONNECTOR_MASSIVE_TYPE;

    readonly config: IConnectorConfig = {
        refreshDelay: 10000,
        useCertificate: false,
    };

    constructor(connectorproviders: ConnectorprovidersService) {
        connectorproviders.register(this);
    }

    async validateCredentialConfig(config: IConnectorMassiveCredential): Promise<void> {
        await validate(
            schemaCredential,
            config
        );
    }

    async validateCredentialCallback(): Promise<any> {
        throw new Error('Not implemented');
    }

    async validateConnectorConfig(
        credentialConfig: IConnectorMassiveCredential,
        connectorConfig: IConnectorMassiveConfig
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
        return new ConnectorMassiveService(connector.connectorConfig);
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
}
