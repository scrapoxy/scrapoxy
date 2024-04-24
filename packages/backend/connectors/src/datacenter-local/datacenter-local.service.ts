import { Logger } from '@nestjs/common';
import {
    Agents,
    DatacenterLocalClient,
} from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_DATACENTER_LOCAL_TYPE,
    EInstanceDatacenterLocalStatus,
    EProxyStatus,
    randomNames,
} from '@scrapoxy/common';
import { TRANSPORT_DATACENTER_LOCAL_TYPE } from './transport/datacenter-local.constants';
import type {
    IConnectorDatacenterLocalConfig,
    IConnectorDatacenterLocalCredential,
} from './datacenter-local.interface';
import type {
    IConnectorService,
    ITransportProxyRefreshedConfigDatacenter,
} from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IInstanceDatacenterLocalView,
    IProxyKeyToRemove,
} from '@scrapoxy/common';


function convertStatus(status: EInstanceDatacenterLocalStatus): EProxyStatus {
    if (!status) {
        return EProxyStatus.ERROR;
    }

    switch (status) {
        case EInstanceDatacenterLocalStatus.STARTING: {
            return EProxyStatus.STARTING;
        }

        case EInstanceDatacenterLocalStatus.STARTED: {
            return EProxyStatus.STARTED;
        }

        case EInstanceDatacenterLocalStatus.STOPPING: {
            return EProxyStatus.STOPPING;
        }

        default: {
            return EProxyStatus.ERROR;
        }
    }
}


function convertToProxy(instance: IInstanceDatacenterLocalView): IConnectorProxyRefreshed {
    const config: ITransportProxyRefreshedConfigDatacenter = {
        address: instance.port ? {
            hostname: 'localhost',
            port: instance.port,
        } : void 0,
    };
    const proxy: IConnectorProxyRefreshed = {
        type: CONNECTOR_DATACENTER_LOCAL_TYPE,
        transportType: TRANSPORT_DATACENTER_LOCAL_TYPE,
        key: instance.id,
        name: instance.id,
        config,
        status: convertStatus(instance.status),
    };

    return proxy;
}


export class ConnectorDatacenterLocalService implements IConnectorService {
    private readonly logger = new Logger(ConnectorDatacenterLocalService.name);

    private readonly api: DatacenterLocalClient;

    constructor(
        url: string,
        agents: Agents,
        private readonly credentialConfig: IConnectorDatacenterLocalCredential,
        private readonly connectorConfig: IConnectorDatacenterLocalConfig
    ) {
        this.api = new DatacenterLocalClient(
            url,
            agents
        );
    }

    async getProxies(): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug('getProxies()');

        const instances = await this.api.getAllInstances(
            this.credentialConfig.subscriptionId,
            this.connectorConfig.region
        );

        return instances.map(convertToProxy);
    }

    async createProxies(count: number): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`createProxies(): count=${count}`);

        if (!this.connectorConfig.imageId) {
            throw new Error('Image ID is not specified');
        }

        const instances = await this.api.createInstances(
            this.credentialConfig.subscriptionId,
            this.connectorConfig.region,
            {
                ids: randomNames(count),
                size: this.connectorConfig.size,
                imageId: this.connectorConfig.imageId,
            }
        );

        return instances.map(convertToProxy);
    }

    async startProxies(): Promise<void> {
        // Nothing
    }

    async removeProxies(keys: IProxyKeyToRemove[]): Promise<string[]> {
        this.logger.debug(`removeProxies(): keys.length=${keys.length}`);

        await this.api.removeInstances(
            this.credentialConfig.subscriptionId,
            this.connectorConfig.region,
            keys.map((p) => ({
                id: p.key,
                force: p.force,
            }))
        );

        return [];
    }
}
