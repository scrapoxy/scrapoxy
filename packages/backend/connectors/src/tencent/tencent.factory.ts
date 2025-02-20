import { Injectable } from '@nestjs/common';
import {
    Agents,
    ConnectorprovidersService,
    CredentialInvalidError,
    validate,
} from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_TENCENT_TYPE,
    ETencentQueryCredential,
    TENCENT_DEFAULT_REGION,
    TENCENT_DEFAULT_ZONE,
} from '@scrapoxy/common';
import { TencentApi } from './api';
import { ConnectorTencentService } from './tencent.service';
import {
    schemaConfig,
    schemaCredential,
} from './tencent.validation';
import type {
    IConnectorTencentConfig,
    IConnectorTencentCredential,
} from './tencent.interface';
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
    ITaskToCreate,
    ITencentQueryInstanceType,
    ITencentQueryZone,
} from '@scrapoxy/common';


const FILTER_INSTANCE_TYPES = [
    'SA2.MEDIUM2',
    'S5.MEDIUM2',
    'SR1.MEDIUM2',
    'S2.MEDIUM2',
    'SA5.MEDIUM2',
    'SA3.MEDIUM2',
];


@Injectable()
export class ConnectorTencentFactory implements IConnectorFactory, OnModuleDestroy {
    readonly type = CONNECTOR_TENCENT_TYPE;

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

    async validateCredentialConfig(config: IConnectorTencentCredential): Promise<void> {
        await validate(
            schemaCredential,
            config
        );

        try {
            const api = new TencentApi(
                config.secretId,
                config.secretKey,
                TENCENT_DEFAULT_REGION,
                this.agents
            );
            await api.describeRegions();
        } catch (err: any) {
            if (err.message.includes('denied')) {
                throw new CredentialInvalidError('Secret access key invalid');
            } else {
                throw new CredentialInvalidError(err.message);
            }
        }
    }

    async validateConnectorConfig(
        credentialConfig: IConnectorTencentCredential,
        connectorConfig: IConnectorTencentConfig
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
        const service = new ConnectorTencentService(
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
        const credentialConfig = credential.config as IConnectorTencentCredential;

        switch (query.type) {
            case ETencentQueryCredential.Regions: {
                return this.queryRegions(credentialConfig);
            }

            case ETencentQueryCredential.Zones: {
                return this.queryZones(
                    credentialConfig,
                    query.parameters as ITencentQueryZone
                );
            }

            case ETencentQueryCredential.InstanceTypes: {
                return this.queryInstanceTypes(
                    credentialConfig,
                    query.parameters as ITencentQueryInstanceType
                );
            }

            default: {
                throw new Error(`Invalid query type: ${query.type}`);
            }
        }
    }

    private async queryRegions(credentialConfig: IConnectorTencentCredential): Promise<string[]> {
        const api = new TencentApi(
            credentialConfig.secretId,
            credentialConfig.secretKey,
            TENCENT_DEFAULT_ZONE,
            this.agents
        );
        const regions = await api.describeRegions();

        return regions;
    }

    private async queryZones(
        credentialConfig: IConnectorTencentCredential, parameters: ITencentQueryZone
    ): Promise<string[]> {
        const api = new TencentApi(
            credentialConfig.secretId,
            credentialConfig.secretKey,
            parameters.region,
            this.agents
        );
        const regions = await api.describeZones(parameters.region);

        return regions;
    }

    private async queryInstanceTypes(
        credentialConfig: IConnectorTencentCredential,
        parameters: ITencentQueryInstanceType
    ): Promise<string[]> {
        const api = new TencentApi(
            credentialConfig.secretId,
            credentialConfig.secretKey,
            parameters.region,
            this.agents
        );
        const instancesTypes = await api.listInstanceTypes(
            FILTER_INSTANCE_TYPES,
            parameters.zone
        );

        return instancesTypes;
    }
}
