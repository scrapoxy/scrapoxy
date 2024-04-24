import {
    Inject,
    Injectable,
} from '@nestjs/common';
import {
    Agents,
    ConnectorCertificateNotFoundError,
    ConnectorInvalidError,
    ConnectorprovidersService,
    CredentialInvalidError,
    CredentialQueryNotFoundError,
    DatacenterLocalClient,
    TasksService,
    validate,
} from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_DATACENTER_LOCAL_TYPE,
    EDatacenterLocalQueryCredential,
} from '@scrapoxy/common';
import { CONNECTOR_DATACENTER_LOCAL_MODULE_CONFIG } from './datacenter-local.constants';
import { ConnectorDatacenterLocalService } from './datacenter-local.service';
import {
    schemaConfig,
    schemaCredential,
} from './datacenter-local.validation';
import {
    DatacenterLocalInstallFactory,
    DatacenterLocalUninstallFactory,
} from './tasks';
import type {
    IConnectorDatacenterLocalConfig,
    IConnectorDatacenterLocalCredential,
} from './datacenter-local.interface';
import type { IConnectorDatacenterLocalModuleConfig } from './datacenter-local.module';
import type {
    IDatacenterLocalInstallCommandData,
    IDatacenterLocalUninstallCommandData,
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
    IDatacenterLocalQueryRegionSizes,
    IRegionDatacenterLocal,
    IRegionSizeDatacenterLocal,
    ITaskToCreate,
} from '@scrapoxy/common';


@Injectable()
export class ConnectorDatacenterLocalFactory implements IConnectorFactory, OnModuleDestroy {
    readonly type = CONNECTOR_DATACENTER_LOCAL_TYPE;

    readonly config: IConnectorConfig = {
        refreshDelay: 2000,
        useCertificate: true,
    };

    private readonly agents = new Agents();

    constructor(
        @Inject(CONNECTOR_DATACENTER_LOCAL_MODULE_CONFIG)
        private readonly moduleConfig: IConnectorDatacenterLocalModuleConfig,
        connectorproviders: ConnectorprovidersService,
        tasks: TasksService
    ) {
        connectorproviders.register(this);

        tasks.register(
            DatacenterLocalInstallFactory.type,
            new DatacenterLocalInstallFactory(this.agents)
        );

        tasks.register(
            DatacenterLocalUninstallFactory.type,
            new DatacenterLocalUninstallFactory(this.agents)
        );
    }

    onModuleDestroy() {
        this.agents.close();
    }

    async validateCredentialConfig(config: IConnectorDatacenterLocalCredential): Promise<void> {
        await validate(
            schemaCredential,
            config
        );

        const api = new DatacenterLocalClient(
            this.moduleConfig.url,
            this.agents
        );
        try {
            await api.getSubscription(config.subscriptionId);
        } catch (err: any) {
            throw new CredentialInvalidError(err.message);
        }
    }

    async validateCredentialCallback(): Promise<any> {
        throw new Error('Not implemented');
    }

    async validateConnectorConfig(
        credentialConfig: IConnectorDatacenterLocalCredential,
        connectorConfig: IConnectorDatacenterLocalConfig
    ): Promise<void> {
        await validate(
            schemaConfig,
            connectorConfig
        );

        const api = new DatacenterLocalClient(
            this.moduleConfig.url,
            this.agents
        );
        try {
            const region = await api.getRegion(connectorConfig.region);

            await api.getRegionSize(
                region.id,
                connectorConfig.size
            );
        } catch (err: any) {
            throw new ConnectorInvalidError(err.message);
        }
    }

    async validateInstallConfig(): Promise<void> {
        // Nothing to validate
    }

    async buildConnectorService(connector: IConnectorToRefresh): Promise<IConnectorService> {
        const service = new ConnectorDatacenterLocalService(
            this.moduleConfig.url,
            this.agents,
            connector.credentialConfig,
            connector.connectorConfig
        );

        return service;
    }

    async buildInstallCommand(
        installId: string,
        credential: ICredentialData,
        connector: IConnectorData,
        certificate: ICertificate | null
    ): Promise<ITaskToCreate> {
        if (!certificate) {
            throw new ConnectorCertificateNotFoundError(
                connector.projectId,
                connector.id
            );
        }

        const
            credentialConfig = credential.config as IConnectorDatacenterLocalCredential;
        const data: IDatacenterLocalInstallCommandData = {
            url: this.moduleConfig.url,
            subscriptionId: credentialConfig.subscriptionId,
            region: connector.config.region,
            imageId: void 0,
            certificate,
        };
        const taskToCreate: ITaskToCreate = {
            type: DatacenterLocalInstallFactory.type,
            stepMax: DatacenterLocalInstallFactory.stepMax,
            message: 'Installing Local connector...',
            data,
        };

        return taskToCreate;
    }

    async buildUninstallCommand(
        credential: ICredentialData,
        connector: IConnectorData
    ): Promise<ITaskToCreate> {
        const
            connectorConfig = connector.config as IConnectorDatacenterLocalConfig,
            credentialConfig = credential.config as IConnectorDatacenterLocalCredential;
        const data: IDatacenterLocalUninstallCommandData = {
            url: this.moduleConfig.url,
            subscriptionId: credentialConfig.subscriptionId,
            region: connectorConfig.region,
            imageId: connectorConfig.imageId,
        };
        const taskToCreate: ITaskToCreate = {
            type: DatacenterLocalUninstallFactory.type,
            stepMax: DatacenterLocalUninstallFactory.stepMax,
            message: 'Uninstalling Local connector...',
            data,
        };

        return taskToCreate;
    }

    async validateInstallCommand(
        credential: ICredentialData,
        connector: IConnectorData
    ): Promise<void> {
        const
            connectorConfig = connector.config as IConnectorDatacenterLocalConfig,
            credentialConfig = credential.config as IConnectorDatacenterLocalCredential;
        const api = new DatacenterLocalClient(
            this.moduleConfig.url,
            this.agents
        );

        try {
            await api.getRegion(connectorConfig.region);

            const subscription = await api.getSubscription(credentialConfig.subscriptionId);

            if (!connectorConfig.imageId) {
                throw new ConnectorInvalidError('No image installed');
            }

            await api.getImage(
                subscription.id,
                connectorConfig.region,
                connectorConfig.imageId
            );
        } catch (err: any) {
            throw new ConnectorInvalidError(err.message);
        }
    }

    async queryCredential(
        credential: ICredentialData, query: ICredentialQuery
    ): Promise<any> {
        switch (query.type) {
            case EDatacenterLocalQueryCredential.Regions: {
                return this.queryRegions();
            }

            case EDatacenterLocalQueryCredential.RegionSizes: {
                return this.queryRegionSizes(query.parameters as IDatacenterLocalQueryRegionSizes);
            }

            default: {
                throw new CredentialQueryNotFoundError(query.type);
            }
        }
    }

    async listAllProxies(): Promise<IConnectorListProxies> {
        throw new Error('Not implemented');
    }

    private async queryRegions(): Promise<IRegionDatacenterLocal[]> {
        const api = new DatacenterLocalClient(
            this.moduleConfig.url,
            this.agents
        );
        const regions = await api.getAllRegions();

        return regions;
    }

    private async queryRegionSizes(parameters: IDatacenterLocalQueryRegionSizes): Promise<IRegionSizeDatacenterLocal[]> {
        const api = new DatacenterLocalClient(
            this.moduleConfig.url,
            this.agents
        );
        const sizes = await api.getAllRegionSizes(parameters.region);

        return sizes;
    }
}
