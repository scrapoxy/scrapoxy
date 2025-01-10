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
import {
    ScalewayInstallFactory,
    ScalewayUninstallFactory,
} from './tasks';
import type {
    IConnectorScalewayConfig,
    IConnectorScalewayCredential,
} from './scaleway.interface';
import type {
    IScalewayInstallCommandData,
    IScalewayUninstallCommandData,
} from './tasks';
import type { OnModuleDestroy } from '@nestjs/common';
import type {
    IConnectorConfig,
    IConnectorFactory,
    IConnectorService,
} from '@scrapoxy/backend-sdk';
import type {
    ICertificate,
    IConnectorData,
    IConnectorListProxies,
    IConnectorToRefresh,
    ICredentialData,
    ICredentialQuery,
    IFingerprintOptions,
    IProxyInfo,
    IScalewayQueryInstanceType,
    ITaskToCreate,
} from '@scrapoxy/common';


const FILTER_INSTANCE_TYPES = [
    'COPARM1-2C-8G',
    'DEV1-S',
    'DEV1-M',
    'PLAY2-NANO',
    'PLAY2-MICRO',
];


@Injectable()
export class ConnectorScalewayFactory implements IConnectorFactory, OnModuleDestroy {
    readonly type = CONNECTOR_SCALEWAY_TYPE;

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
            ScalewayInstallFactory.type,
            new ScalewayInstallFactory(this.agents)
        );

        tasks.register(
            ScalewayUninstallFactory.type,
            new ScalewayUninstallFactory(this.agents)
        );
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

            await api.listInstanceTypes();
        } catch (err: any) {
            throw new CredentialInvalidError(err.message);
        }
    }

    async validateCredentialCallback(): Promise<IConnectorScalewayCredential> {
        throw new Error('Not implemented');
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
            connectorConfig = connector.config as IConnectorScalewayConfig,
            credentialConfig = credential.config as IConnectorScalewayCredential;
        const data: IScalewayInstallCommandData = {
            secretAccessKey: credentialConfig.secretAccessKey,
            region: connectorConfig.region,
            projectId: credentialConfig.projectId,
            hostname: void 0,
            port: connectorConfig.port,
            certificate,
            instanceId: void 0,
            instanceType: connectorConfig.instanceType,
            imageId: void 0,
            snapshotId: void 0,
            fingerprintOptions,
            installId,
            tag: void 0,
        };
        const taskToCreate: ITaskToCreate = {
            type: ScalewayInstallFactory.type,
            name: `Install Scaleway on connector ${connector.name} in region ${connectorConfig.region}`,
            stepMax: ScalewayInstallFactory.stepMax,
            message: 'Installing Scaleway image...',
            data,
        };

        return taskToCreate;
    }

    async buildUninstallCommand(
        credential: ICredentialData,
        connector: IConnectorData
    ): Promise<ITaskToCreate> {
        const
            connectorConfig = connector.config as IConnectorScalewayConfig,
            credentialConfig = credential.config as IConnectorScalewayCredential;
        const data: IScalewayUninstallCommandData = {
            secretAccessKey: credentialConfig.secretAccessKey,
            region: connectorConfig.region,
            snapshotId: connectorConfig.snapshotId,
            imageId: connectorConfig.imageId,
            projectId: credentialConfig.projectId,
        };
        const taskToCreate: ITaskToCreate = {
            type: ScalewayUninstallFactory.type,
            name: `Uninstall Scaleway on connector ${connector.name} in region ${connectorConfig.region}`,
            stepMax: ScalewayUninstallFactory.stepMax,
            message: 'Uninstalling Scaleway datacenter...',
            data,
        };

        return taskToCreate;
    }

    async validateInstallCommand(
        credential: ICredentialData,
        connector: IConnectorData
    ): Promise<void> {
        const connectorConfig = connector.config as IConnectorScalewayConfig;

        if (!connectorConfig.imageId || connectorConfig.imageId.length <= 0) {
            throw new ConnectorInvalidError('Image ID cannot be empty');
        }

        const credentialConfig = credential.config as IConnectorScalewayCredential;
        const api = new ScalewayApi(
            credentialConfig.secretAccessKey,
            connectorConfig.region,
            credentialConfig.projectId,
            this.agents
        );
        const image = await api.getImage(connectorConfig.imageId);

        if (!image) {
            throw new ConnectorInvalidError(`Cannot find image ${connectorConfig.imageId}`);
        }
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
                throw new CredentialQueryNotFoundError(query.type);
            }
        }
    }

    async listAllProxies(credentialConfig: IConnectorScalewayCredential): Promise<IConnectorListProxies> {
        const response: IConnectorListProxies = {
            proxies: [],
            errors: [],
        };

        try {
            const
                promises: Promise<void>[] = [];
            for (const region in EScalewayRegions) {
                const promise = (async() => {
                    const apiRegion = new ScalewayApi(
                        credentialConfig.secretAccessKey,
                        region,
                        credentialConfig.projectId,
                        this.agents
                    );
                    const instances = await apiRegion.listInstances();

                    for (const instance of instances) {
                        const proxy: IProxyInfo = {
                            key: instance.id[ 0 ],
                            description: `region=${region}`,
                        };
                        response.proxies.push(proxy);
                    }
                })();

                promises.push(promise);
            }

            await Promise.all(promises);
        } catch (err: any) {
            response.errors.push(err.message);
        }

        return response;
    }

    private async queryRegions(): Promise<string[]> {
        return Object.values(EScalewayRegions);
    }

    private async queryInstanceTypes(
        credentialConfig: IConnectorScalewayCredential,
        parameters: IScalewayQueryInstanceType
    ): Promise<string[]> {
        const api = new ScalewayApi(
            credentialConfig.secretAccessKey,
            parameters.region,
            credentialConfig.projectId,
            this.agents
        );
        const instancesTypes = await api.listInstanceTypes(FILTER_INSTANCE_TYPES);

        return instancesTypes;
    }
}
