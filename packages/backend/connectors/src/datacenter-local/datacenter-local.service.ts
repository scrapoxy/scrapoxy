import { Logger } from '@nestjs/common';
import {
    Agents,
    DatacenterLocalClient,
} from '@scrapoxy/backend-sdk';
import { randomNames } from '@scrapoxy/common';
import { convertToProxy } from './datacenter-local.helpers';
import type {
    IConnectorDatacenterLocalConfig,
    IConnectorDatacenterLocalCredential,
} from './datacenter-local.interface';
import type { IConnectorService } from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IProxyKeyToRemove,
} from '@scrapoxy/common';


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
