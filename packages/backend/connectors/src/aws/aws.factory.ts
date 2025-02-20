import { Injectable } from '@nestjs/common';
import {
    Agents,
    ConnectorInvalidError,
    ConnectorprovidersService,
    CredentialInvalidError,
    validate,
} from '@scrapoxy/backend-sdk';
import {
    AWS_DEFAULT_REGION,
    CONNECTOR_AWS_TYPE,
    EAwsQueryCredential,
} from '@scrapoxy/common';
import { AwsApi } from './api';
import { ConnectorAwsService } from './aws.service';
import {
    schemaConfig,
    schemaCredential,
} from './aws.validation';
import type {
    IConnectorAwsConfig,
    IConnectorAwsCredential,
} from './aws.interface';
import type { OnModuleDestroy } from '@nestjs/common';
import type {
    IConnectorConfig,
    IConnectorFactory,
    IConnectorService,
} from '@scrapoxy/backend-sdk';
import type {
    IAwsQueryInstanceType,
    ICertificate,
    IConnectorData,
    IConnectorToRefresh,
    ICredentialData,
    ICredentialQuery,
    ITaskToCreate,
} from '@scrapoxy/common';


const FILTER_INSTANCE_TYPES = [
    't4g.nano',
    't3a.nano',
    't3.nano',
    't2.nano',
    't4g.micro',
    't3a.micro',
    't3.micro',
    't2.micro',
];


@Injectable()
export class ConnectorAwsFactory implements IConnectorFactory, OnModuleDestroy {
    readonly type = CONNECTOR_AWS_TYPE;

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

    async validateCredentialConfig(config: IConnectorAwsCredential): Promise<void> {
        await validate(
            schemaCredential,
            config
        );

        try {
            const api = new AwsApi(
                config.accessKeyId,
                config.secretAccessKey,
                AWS_DEFAULT_REGION,
                this.agents
            );

            await api.describeRegions([
                AWS_DEFAULT_REGION,
            ]);
        } catch (err: any) {
            throw new CredentialInvalidError(err.message);
        }
    }

    async validateConnectorConfig(
        credentialConfig: IConnectorAwsCredential,
        connectorConfig: IConnectorAwsConfig
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
        const service = new ConnectorAwsService(
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

    async validateInstallCommand(
        credential: ICredentialData,
        connector: IConnectorData
    ): Promise<void> {
        const connectorConfig = connector.config as IConnectorAwsConfig;
        const credentialConfig = credential.config as IConnectorAwsCredential;
        const api = new AwsApi(
            credentialConfig.accessKeyId,
            credentialConfig.secretAccessKey,
            connectorConfig.region,
            this.agents
        );

        // Create security group
        try {
            await api.createSecurityGroup(connectorConfig.securityGroupName);
        } catch (err: any) {
            if (err.code !== 'InvalidGroup.Duplicate') {
                throw new ConnectorInvalidError(err.message);
            }
        }

        // Add security rule
        try {
            await api.authorizeSecurityGroupIngress(
                connectorConfig.securityGroupName,
                [
                    {
                        protocol: 'tcp',
                        fromPort: connectorConfig.port,
                        toPort: connectorConfig.port,
                        cidrIp: '0.0.0.0/0',
                    },
                ]
            );
        } catch (err: any) {
            if (err.code !== 'InvalidPermission.Duplicate') {
                throw new ConnectorInvalidError(err.message);
            }
        }
    }

    async queryCredential(
        credential: ICredentialData, query: ICredentialQuery
    ): Promise<any> {
        const credentialConfig = credential.config as IConnectorAwsCredential;

        switch (query.type) {
            case EAwsQueryCredential.Regions: {
                return this.queryRegions(credentialConfig);
            }

            case EAwsQueryCredential.InstanceTypes: {
                return this.queryInstanceTypes(
                    credentialConfig,
                    query.parameters as IAwsQueryInstanceType
                );
            }

            default: {
                throw new Error(`Invalid query type: ${query.type}`);
            }
        }
    }

    private async queryRegions(credentialConfig: IConnectorAwsCredential): Promise<string[]> {
        const api = new AwsApi(
            credentialConfig.accessKeyId,
            credentialConfig.secretAccessKey,
            AWS_DEFAULT_REGION,
            this.agents
        );
        const regions = await api.describeRegions([]);

        return regions;
    }

    private async queryInstanceTypes(
        credentialConfig: IConnectorAwsCredential,
        parameters: IAwsQueryInstanceType
    ): Promise<string[]> {
        const api = new AwsApi(
            credentialConfig.accessKeyId,
            credentialConfig.secretAccessKey,
            parameters.region,
            this.agents
        );
        const instancesTypes = await api.describeInstancesTypes(FILTER_INSTANCE_TYPES);
        const types = instancesTypes.map((t) => t.instanceType[ 0 ]);

        return types;
    }
}
