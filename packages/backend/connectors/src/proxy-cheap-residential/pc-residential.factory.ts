import { Injectable } from '@nestjs/common';
import {
    ConnectorprovidersService,
    validate,
} from '@scrapoxy/backend-sdk';
import { CONNECTOR_PROXY_CHEAP_RESIDENTIAL_TYPE } from '@scrapoxy/common';
import { ConnectorProxyCheapResidentialService } from './pc-residential.service';
import {
    schemaConfig,
    schemaCredential,
} from './pc-residential.validation';
import type {
    IConnectorProxyCheapResidentialConfig,
    IConnectorProxyCheapResidentialCredential,
} from './pc-residential.interface';
import type {
    IConnectorConfig,
    IConnectorFactory,
    IConnectorService,
} from '@scrapoxy/backend-sdk';
import type { ITaskToCreate } from '@scrapoxy/common';


@Injectable()
export class ConnectorProxyCheapResidentialFactory implements IConnectorFactory {
    readonly type = CONNECTOR_PROXY_CHEAP_RESIDENTIAL_TYPE;

    readonly config: IConnectorConfig = {
        refreshDelay: 10000,
        useCertificate: false,
    };

    constructor(connectorproviders: ConnectorprovidersService) {
        connectorproviders.register(this);
    }

    async validateCredentialConfig(config: IConnectorProxyCheapResidentialCredential): Promise<void> {
        await validate(
            schemaCredential,
            config
        );
    }

    async validateConnectorConfig(
        credentialConfig: IConnectorProxyCheapResidentialCredential,
        connectorConfig: IConnectorProxyCheapResidentialConfig
    ): Promise<void> {
        await validate(
            schemaConfig,
            connectorConfig
        );
    }

    async validateInstallConfig(): Promise<void> {
        // Nothing to validate
    }

    async buildConnectorService(): Promise<IConnectorService> {
        return new ConnectorProxyCheapResidentialService();
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
