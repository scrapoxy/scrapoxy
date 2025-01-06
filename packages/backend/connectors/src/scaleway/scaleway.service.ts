import { Logger } from '@nestjs/common';
import type {
    IConnectorService,
    ITransportProxyRefreshedConfigDatacenter,
} from '@scrapoxy/backend-sdk';
import { Agents, TRANSPORT_DATACENTER_TYPE } from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IProxyKeyToRemove,
} from '@scrapoxy/common';
import {
    CONNECTOR_SCALEWAY_TYPE,
    EProxyStatus,
    randomName,
} from '@scrapoxy/common';
import { ScalewayApi } from './api';
import {
    EScalewayInstanceState,
    type IConnectorScalewayConfig,
    type IConnectorScalewayCredential,
    type IScalewayInstance
} from './scaleway.interface';

function convertStatus(code: EScalewayInstanceState): EProxyStatus {
    switch (code) {
        case EScalewayInstanceState.STARTING:
            return EProxyStatus.STARTING;
        case EScalewayInstanceState.RUNNING:
            return EProxyStatus.STARTED;
        case EScalewayInstanceState.STOPPING:
            return EProxyStatus.STOPPING;
        case EScalewayInstanceState.STOPPED:
        case EScalewayInstanceState.STOPPED_IN_PLACE:
            return EProxyStatus.STOPPED;
        default:
            return EProxyStatus.ERROR;
    }
}

export class ConnectorScalewayService implements IConnectorService {
    private readonly logger = new Logger(ConnectorScalewayService.name);

    private readonly api: ScalewayApi;

    constructor(
        private readonly credentialConfig: IConnectorScalewayCredential,
        private readonly connectorConfig: IConnectorScalewayConfig,
        agents: Agents
    ) {
        this.api = new ScalewayApi(
            credentialConfig.secretAccessKey,
            connectorConfig.region,
            credentialConfig.projectId,
            agents
        );
    }

    public async getProxies(): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug('getProxies()');

        const instances = await this.api.listInstances(
            this.connectorConfig.tag
        );

        return instances.map((i) => {
            const config: ITransportProxyRefreshedConfigDatacenter = {
                address:
                    i.public_ips && i.public_ips.length > 0
                        ? {
                              hostname: i.public_ips[0].address,
                              port: this.connectorConfig.port,
                          }
                        : void 0,
            };
            const proxy: IConnectorProxyRefreshed = {
                type: CONNECTOR_SCALEWAY_TYPE,
                transportType: TRANSPORT_DATACENTER_TYPE,
                key: i.id,
                name: i.id,
                config,
                status: convertStatus(i.state),
            };

            return proxy;
        });
    }

    public async createProxies(count: number): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`createProxies(): count=${count}`);
        
        const proxies = new Array(count).fill('');
        const batchSize = 10;
        const allInstances: IConnectorProxyRefreshed[] = [];
        // Create proxies 10 by 10
        for (let i = 0; i < proxies.length; i += batchSize) {
            const chunk = proxies.slice(i, i + batchSize);
        
            const instances = await Promise.all(chunk.map(() => this.createProxy()));
        
            const refreshedProxies = instances.map((instance) => {
                const config: ITransportProxyRefreshedConfigDatacenter = {
                address:
                    instance.public_ips && instance.public_ips.length > 0
                    ? {
                        hostname: instance.public_ips[0].address,
                        port: this.connectorConfig.port,
                        }
                    : undefined,
                };
      
                const proxy: IConnectorProxyRefreshed = {
                    type: CONNECTOR_SCALEWAY_TYPE,
                    transportType: TRANSPORT_DATACENTER_TYPE,
                    key: instance.id,
                    name: instance.id,
                    config,
                    status: convertStatus(instance.state),
                };
                return proxy;
            });

            allInstances.push(...refreshedProxies);
        }
      
        return allInstances;
      }
      

    public async startProxies(keys: string[]): Promise<void> {
        this.logger.debug(`startProxies(): keys.length=${keys.length}`);

        await Promise.all(keys.map(key => this.api.startInstance(key)));
    }

    public async removeProxies(keys: IProxyKeyToRemove[]): Promise<string[]> {
        this.logger.debug(`removeProxies(): keys.length=${keys.length}`);

        const proxiesKeys = keys.map((p) => p.key);
        await Promise.all(proxiesKeys.map(key => this.removeProxy(key)));

        return [];
    }

    private async createProxy(): Promise<IScalewayInstance> {
        const instance_name = randomName();

        const instance = await this.api.createInstance({
            name: instance_name,
            image: this.connectorConfig.imageId,
            commercial_type: this.connectorConfig.instanceType,
            project: this.credentialConfig.projectId,
            tags: [this.connectorConfig.tag],
        });
            
        await this.api.attachIP(instance.id)

        await this.api.startInstance(instance.id)

        return (instance)
    }

    private async removeProxy(proxyId: string) {
        const instance = await this.api.getInstance(proxyId)
        if (instance.public_ips && instance.public_ips[0]) {
            await this.api.deleteIP(instance.public_ips[0].id)
        }
        await this.api.terminateInstance(instance.id)
    }
}
