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
    TasksService,
    validate,
} from '@scrapoxy/backend-sdk';
import { CloudlocalClient } from '@scrapoxy/cloudlocal';
import {
    CONNECTOR_CLOUDLOCAL_TYPE,
    ECloudlocalQueryCredential,
} from '@scrapoxy/connector-cloudlocal-sdk';
import { CONNECTOR_CLOUDLOCAL_MODULE_CONFIG } from './cloudlocal.constants';
import { ConnectorCloudlocalService } from './cloudlocal.service';
import {
    schemaConfig,
    schemaCredential,
} from './cloudlocal.validation';
import {
    CloudlocalInstallFactory,
    CloudlocalUninstallFactory,
} from './tasks';
import { TRANSPORT_CLOUDLOCAL_TYPE } from './transport/cloudlocal.constants';
import type {
    IConnectorCloudlocalConfig,
    IConnectorCloudlocalCredential,
} from './cloudlocal.interface';
import type { IConnectorCloudlocalModuleConfig } from './cloudlocal.module';
import type {
    ICloudlocalInstallCommandData,
    ICloudlocalUninstallCommandData,
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
    ITaskToCreate,
} from '@scrapoxy/common';
import type {
    ICloudlocalQueryRegionSizes,
    IRegionCloudlocal,
    IRegionSizeCloudlocal,
} from '@scrapoxy/connector-cloudlocal-sdk';


@Injectable()
export class ConnectorCloudlocalFactory implements IConnectorFactory, OnModuleDestroy {
    readonly type = CONNECTOR_CLOUDLOCAL_TYPE;

    readonly config: IConnectorConfig = {
        refreshDelay: 2000,
        transportType: TRANSPORT_CLOUDLOCAL_TYPE,
        useCertificate: true,
    };

    private readonly agents = new Agents();

    constructor(
        @Inject(CONNECTOR_CLOUDLOCAL_MODULE_CONFIG)
        private readonly moduleConfig: IConnectorCloudlocalModuleConfig,
        connectorproviders: ConnectorprovidersService,
        tasks: TasksService
    ) {
        connectorproviders.register(this);

        tasks.register(
            CloudlocalInstallFactory.type,
            new CloudlocalInstallFactory(this.agents)
        );

        tasks.register(
            CloudlocalUninstallFactory.type,
            new CloudlocalUninstallFactory(this.agents)
        );
    }

    onModuleDestroy() {
        this.agents.close();
    }

    async validateCredentialConfig(config: IConnectorCloudlocalCredential): Promise<void> {
        await validate(
            schemaCredential,
            config
        );

        const api = new CloudlocalClient(
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
        credentialConfig: IConnectorCloudlocalCredential,
        connectorConfig: IConnectorCloudlocalConfig
    ): Promise<void> {
        await validate(
            schemaConfig,
            connectorConfig
        );

        const api = new CloudlocalClient(
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
        const service = new ConnectorCloudlocalService(
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
            credentialConfig = credential.config as IConnectorCloudlocalCredential;
        const data: ICloudlocalInstallCommandData = {
            url: this.moduleConfig.url,
            subscriptionId: credentialConfig.subscriptionId,
            region: connector.config.region,
            imageId: void 0,
            certificate,
        };
        const taskToCreate: ITaskToCreate = {
            type: CloudlocalInstallFactory.type,
            stepMax: CloudlocalInstallFactory.stepMax,
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
            connectorConfig = connector.config as IConnectorCloudlocalConfig,
            credentialConfig = credential.config as IConnectorCloudlocalCredential;
        const data: ICloudlocalUninstallCommandData = {
            url: this.moduleConfig.url,
            subscriptionId: credentialConfig.subscriptionId,
            region: connectorConfig.region,
            imageId: connectorConfig.imageId,
        };
        const taskToCreate: ITaskToCreate = {
            type: CloudlocalUninstallFactory.type,
            stepMax: CloudlocalUninstallFactory.stepMax,
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
            connectorConfig = connector.config as IConnectorCloudlocalConfig,
            credentialConfig = credential.config as IConnectorCloudlocalCredential;
        const api = new CloudlocalClient(
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
            case ECloudlocalQueryCredential.Regions: {
                return this.queryRegions();
            }

            case ECloudlocalQueryCredential.RegionSizes: {
                return this.queryRegionSizes(query.parameters as ICloudlocalQueryRegionSizes);
            }

            default: {
                throw new CredentialQueryNotFoundError(query.type);
            }
        }
    }

    async listAllProxies(): Promise<IConnectorListProxies> {
        throw new Error('Not implemented');
    }

    private async queryRegions(): Promise<IRegionCloudlocal[]> {
        const api = new CloudlocalClient(
            this.moduleConfig.url,
            this.agents
        );
        const regions = await api.getAllRegions();

        return regions;
    }

    private async queryRegionSizes(parameters: ICloudlocalQueryRegionSizes): Promise<IRegionSizeCloudlocal[]> {
        const api = new CloudlocalClient(
            this.moduleConfig.url,
            this.agents
        );
        const sizes = await api.getAllRegionSizes(parameters.region);

        return sizes;
    }
}
