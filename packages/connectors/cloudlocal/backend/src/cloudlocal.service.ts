import { Logger } from '@nestjs/common';
import { Agents } from '@scrapoxy/backend-sdk';
import { CloudlocalClient } from '@scrapoxy/cloudlocal';
import {
    EProxyStatus,
    randomNames,
    safeJoin,
} from '@scrapoxy/common';
import {
    CONNECTOR_CLOUDLOCAL_TYPE,
    EInstanceCloudlocalStatus,
} from '@scrapoxy/connector-cloudlocal-sdk';
import type {
    IConnectorCloudlocalConfig,
    IConnectorCloudlocalCredential,
} from './cloudlocal.interface';
import type {
    IConnectorService,
    ITransportProxyRefreshedConfigCloud,
} from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IProxyKeyToRemove,
} from '@scrapoxy/common';
import type { IInstanceCloudlocalView } from '@scrapoxy/connector-cloudlocal-sdk';


function convertStatus(status: EInstanceCloudlocalStatus): EProxyStatus {
    if (!status) {
        return EProxyStatus.ERROR;
    }

    switch (status) {
        case EInstanceCloudlocalStatus.STARTING: {
            return EProxyStatus.STARTING;
        }

        case EInstanceCloudlocalStatus.STARTED: {
            return EProxyStatus.STARTED;
        }

        case EInstanceCloudlocalStatus.STOPPING: {
            return EProxyStatus.STOPPING;
        }

        default: {
            return EProxyStatus.ERROR;
        }
    }
}


function convertToProxy(instance: IInstanceCloudlocalView): IConnectorProxyRefreshed {
    const config: ITransportProxyRefreshedConfigCloud = {
        address: instance.port ? {
            hostname: 'localhost',
            port: instance.port,
        } : void 0,
    };
    const proxy: IConnectorProxyRefreshed = {
        type: CONNECTOR_CLOUDLOCAL_TYPE,
        key: instance.id,
        name: instance.id,
        config,
        status: convertStatus(instance.status),
    };

    return proxy;
}


export class ConnectorCloudlocalService implements IConnectorService {
    private readonly logger = new Logger(ConnectorCloudlocalService.name);

    private readonly api: CloudlocalClient;

    constructor(
        url: string,
        agents: Agents,
        private readonly credentialConfig: IConnectorCloudlocalCredential,
        private readonly connectorConfig: IConnectorCloudlocalConfig
    ) {
        this.api = new CloudlocalClient(
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
        this.logger.debug(`removeProxies(): keys=${safeJoin(keys.map((p) => p.key))}`);

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
