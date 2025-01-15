import { Injectable } from '@nestjs/common';
import {
    Agents,
    ConnectorCertificateNotFoundError,
    ConnectorInvalidError,
    ConnectorprovidersService,
    CredentialInvalidError,
    CredentialQueryNotFoundError,
    TasksService,
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
import {
    AwsInstallFactory,
    AwsUninstallFactory,
} from './tasks';
import type {
    IConnectorAwsConfig,
    IConnectorAwsCredential,
} from './aws.interface';
import type {
    IAwsInstallCommandData,
    IAwsUninstallCommandData,
} from './tasks';
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
    IFingerprintOptions,
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

    constructor(
        connectorsproviders: ConnectorprovidersService,
        tasks: TasksService
    ) {
        connectorsproviders.register(this);

        tasks.register(
            AwsInstallFactory.type,
            new AwsInstallFactory(this.agents)
        );

        tasks.register(
            AwsUninstallFactory.type,
            new AwsUninstallFactory(this.agents)
        );
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

    async validateCredentialCallback(): Promise<IConnectorAwsCredential> {
        throw new Error('Not implemented');
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
            this.agents
        );

        return service;
    }

    async buildInstallCommand(
        installId: string,
        credential: ICredentialData,
        connector: IConnectorData,
        certificate: ICertificate | null,
        fingerprintOptions: IFingerprintOptions
    ): Promise<ITaskToCreate> {
        if (!certificate) {
            throw new ConnectorCertificateNotFoundError(
                connector.projectId,
                connector.id
            );
        }

        const
            connectorConfig = connector.config as IConnectorAwsConfig,
            credentialConfig = credential.config as IConnectorAwsCredential;
        const data: IAwsInstallCommandData = {
            accessKeyId: credentialConfig.accessKeyId,
            secretAccessKey: credentialConfig.secretAccessKey,
            region: connectorConfig.region,
            hostname: void 0,
            port: connectorConfig.port,
            certificate,
            instanceId: void 0,
            instanceType: connectorConfig.instanceType,
            securityGroupName: connectorConfig.securityGroupName,
            imageId: void 0,
            fingerprintOptions,
            installId,
        };
        const taskToCreate: ITaskToCreate = {
            type: AwsInstallFactory.type,
            name: `Install AWS on connector ${connector.name} in region ${connectorConfig.region}`,
            stepMax: AwsInstallFactory.stepMax,
            message: 'Installing AWS image...',
            data,
        };

        return taskToCreate;
    }

    async buildUninstallCommand(
        credential: ICredentialData,
        connector: IConnectorData
    ): Promise<ITaskToCreate> {
        const
            connectorConfig = connector.config as IConnectorAwsConfig,
            credentialConfig = credential.config as IConnectorAwsCredential;
        const data: IAwsUninstallCommandData = {
            accessKeyId: credentialConfig.accessKeyId,
            secretAccessKey: credentialConfig.secretAccessKey,
            region: connectorConfig.region,
            securityGroupName: connectorConfig.securityGroupName,
            imageId: connectorConfig.imageId,
            snapshotsIds: [],
        };
        const taskToCreate: ITaskToCreate = {
            type: AwsUninstallFactory.type,
            name: `Uninstall AWS on connector ${connector.name} in region ${connectorConfig.region}`,
            stepMax: AwsUninstallFactory.stepMax,
            message: 'Uninstalling Aws datacenter...',
            data,
        };

        return taskToCreate;
    }

    async validateInstallCommand(
        credential: ICredentialData,
        connector: IConnectorData
    ): Promise<void> {
        const connectorConfig = connector.config as IConnectorAwsConfig;

        if (!connectorConfig.imageId || connectorConfig.imageId.length <= 0) {
            throw new ConnectorInvalidError('Image ID cannot be empty');
        }

        const credentialConfig = credential.config as IConnectorAwsCredential;
        const api = new AwsApi(
            credentialConfig.accessKeyId,
            credentialConfig.secretAccessKey,
            connectorConfig.region,
            this.agents
        );
        const sgroup = await api.hasSecurityGroup(connectorConfig.securityGroupName);

        if (!sgroup) {
            throw new ConnectorInvalidError(`Cannot find security group ${connectorConfig.securityGroupName}`);
        }

        const image = await api.describeImage(connectorConfig.imageId);

        if (!image) {
            throw new ConnectorInvalidError(`Cannot find image ${connectorConfig.imageId}`);
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
                throw new CredentialQueryNotFoundError(query.type);
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
