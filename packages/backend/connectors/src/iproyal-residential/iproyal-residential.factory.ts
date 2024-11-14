import { Injectable } from '@nestjs/common';
import {
    ConnectorprovidersService,
    validate,
} from '@scrapoxy/backend-sdk';
import { CONNECTOR_IPROYAL_RESIDENTIAL_TYPE } from '@scrapoxy/common';
import { ConnectorIproyalService } from './iproyal-residential.service';
import {
    schemaConfig,
    schemaCredential,
} from './iproyal-residential.validation';
import type {
    IConnectorIproyalResidentialConfig,
    IConnectorIproyalResidentialCredential,
} from './iproyal-residential.interface';
import type {
    IConnectorConfig,
    IConnectorFactory,
    IConnectorService,
} from '@scrapoxy/backend-sdk';
import type {
    IConnectorListProxies,
    ITaskToCreate,
} from '@scrapoxy/common';


@Injectable()
export class ConnectorIproyalResidentialFactory implements IConnectorFactory {
    readonly type = CONNECTOR_IPROYAL_RESIDENTIAL_TYPE;

    readonly config: IConnectorConfig = {
        refreshDelay: 10000,
        useCertificate: false,
    };

    constructor(connectorproviders: ConnectorprovidersService) {
        connectorproviders.register(this);
    }

    async validateCredentialConfig(config: IConnectorIproyalResidentialCredential): Promise<void> {
        await validate(
            schemaCredential,
            config
        );
    }

    async validateCredentialCallback(): Promise<any> {
        throw new Error('Not implemented');
    }

    async validateConnectorConfig(
        credentialConfig: IConnectorIproyalResidentialCredential,
        connectorConfig: IConnectorIproyalResidentialConfig
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
        return new ConnectorIproyalService();
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
