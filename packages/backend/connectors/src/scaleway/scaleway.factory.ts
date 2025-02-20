import { Injectable } from '@nestjs/common';
import {
    Agents,
    ConnectorprovidersService,
    CredentialInvalidError,
    validate,
} from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_SCALEWAY_TYPE,
    EScalewayQueryCredential,
    SCALEWAY_DEFAULT_REGION,
} from '@scrapoxy/common';
import { ScalewayApi } from './api';
import { EScalewayRegions } from './scaleway.interface';
import { ConnectorScalewayService } from './scaleway.service';
import {
    schemaConfig,
    schemaCredential,
} from './scaleway.validation';
import type {
    IConnectorScalewayConfig,
    IConnectorScalewayCredential,
} from './scaleway.interface';
import type { OnModuleDestroy } from '@nestjs/common';
import type {
    IConnectorConfig,
    IConnectorFactory,
    IConnectorService,
} from '@scrapoxy/backend-sdk';
import type {
    ICertificate,
    IConnectorToRefresh,
    ICredentialData,
    ICredentialQuery,
    IScalewayInstanceType,
    IScalewayQueryInstanceType,
    ITaskToCreate,
} from '@scrapoxy/common';


const MAX_HOURLY_PRICE = 0.02; // euro


@Injectable()
export class ConnectorScalewayFactory implements IConnectorFactory, OnModuleDestroy {
    readonly type = CONNECTOR_SCALEWAY_TYPE;

    readonly config: IConnectorConfig = {
        refreshDelay: 10000,
        useCertificate: true,
    };

    private readonly agents = new Agents();

    constructor(connectorsproviders: ConnectorprovidersService) {
        connectorsproviders.register(this);
    }

    onModuleDestroy() {
        this.agents.close();
    }

    async validateCredentialConfig(config: IConnectorScalewayCredential): Promise<void> {
        await validate(
            schemaCredential,
            config
        );

        try {
            const api = new ScalewayApi(
                config.secretAccessKey,
                SCALEWAY_DEFAULT_REGION,
                config.projectId,
                this.agents
            );

            await api.listInstances();
        } catch (err: any) {
            if (err.message.includes('denied')) {
                throw new CredentialInvalidError('Secret access key invalid');
            } else {
                throw new CredentialInvalidError(err.message);
            }
        }
    }

    async validateConnectorConfig(
        credentialConfig: IConnectorScalewayCredential,
        connectorConfig: IConnectorScalewayConfig
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
        const service = new ConnectorScalewayService(
            connector.credentialConfig,
            connector.connectorConfig,
            connector.certificate as ICertificate,
            this.agents
        );

        return service;
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

    async queryCredential(
        credential: ICredentialData, query: ICredentialQuery
    ): Promise<any> {
        const credentialConfig = credential.config as IConnectorScalewayCredential;

        switch (query.type) {
            case EScalewayQueryCredential.Regions: {
                return this.queryRegions();
            }

            case EScalewayQueryCredential.InstanceTypes: {
                return this.queryInstanceTypes(
                    credentialConfig,
                    query.parameters as IScalewayQueryInstanceType
                );
            }

            default: {
                throw new Error(`Invalid query type: ${query.type}`);
            }
        }
    }

    private async queryRegions(): Promise<string[]> {
        return Object.values(EScalewayRegions);
    }

    private async queryInstanceTypes(
        credentialConfig: IConnectorScalewayCredential,
        parameters: IScalewayQueryInstanceType
    ): Promise<IScalewayInstanceType[]> {
        const api = new ScalewayApi(
            credentialConfig.secretAccessKey,
            parameters.region,
            credentialConfig.projectId,
            this.agents
        );
        const instancesTypes = await api.listInstanceTypes(MAX_HOURLY_PRICE);

        return instancesTypes;
    }
}
