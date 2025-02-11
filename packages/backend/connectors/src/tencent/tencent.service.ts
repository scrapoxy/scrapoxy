import { Logger } from '@nestjs/common';
import {
    Agents,
    RunScriptBuilder,
    TRANSPORT_DATACENTER_TYPE,
} from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_TENCENT_TYPE,
    EProxyStatus,
    randomName,
} from '@scrapoxy/common';
import { TencentApi } from './api';
import { convertToProxy } from './tencent.helpers';
import { ETencentInstanceState } from './tencent.interface';
import type {
    IConnectorTencentConfig,
    IConnectorTencentCredential, 
} from './tencent.interface';
import type {
    IConnectorService,
    ITransportProxyRefreshedConfigDatacenter,
} from '@scrapoxy/backend-sdk';
import type {
    ICertificate,
    IConnectorProxyRefreshed,
    IProxyKeyToRemove,
} from '@scrapoxy/common';


function convertStatus(code: ETencentInstanceState): EProxyStatus {
    switch (code) {
        case ETencentInstanceState.STARTING:
        case ETencentInstanceState.PENDING:
        case ETencentInstanceState.REBOOTING:
            return EProxyStatus.STARTING;
        case ETencentInstanceState.RUNNING:
            return EProxyStatus.STARTED;
        case ETencentInstanceState.STOPPING:
            return EProxyStatus.STOPPING;
        case ETencentInstanceState.STOPPED:
            return EProxyStatus.STOPPED;
        default:
            return EProxyStatus.ERROR;
    }
}


export class ConnectorTencentService implements IConnectorService {
    private readonly logger = new Logger(ConnectorTencentService.name);

    private readonly api: TencentApi;

    constructor(
        public readonly credentialConfig: IConnectorTencentCredential,
        private readonly connectorConfig: IConnectorTencentConfig,
        private readonly certificate: ICertificate,
        agents: Agents
    ) {
        this.api = new TencentApi(
            credentialConfig.secretId,
            credentialConfig.secretKey,
            connectorConfig.region,
            agents
        );
    }

    public async getProxies(): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug('getProxies()');

        const instances = await this.api.describeInstances({
            group: this.connectorConfig.tag,
        });
        const countryLike = this.connectorConfig.zone.substring(
            0,
            2
        );

        return instances.map((instance) => {
            const config: ITransportProxyRefreshedConfigDatacenter = {
                address:
                    instance.PublicIpAddresses && instance.PublicIpAddresses.length > 0
                        ? {
                            hostname: instance.PublicIpAddresses[ 0 ],
                            port: this.connectorConfig.port,
                        }
                        : void 0,
            };
            const proxy: IConnectorProxyRefreshed = {
                type: CONNECTOR_TENCENT_TYPE,
                transportType: TRANSPORT_DATACENTER_TYPE,
                key: instance.InstanceId,
                name: instance.InstanceName,
                config,
                status: convertStatus(instance.InstanceState),
                removingForceCap: false,
                countryLike,
            };

            return proxy;
        });
    }

    async createProxies(count: number): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`createProxies(): count=${count}`);
    
        const userData = await new RunScriptBuilder(
            this.connectorConfig.port,
            this.certificate
        )
            .build();
        const instancesIds = await this.api.runInstances({
            count: count,
            instanceName: randomName(),
            instanceType: this.connectorConfig.instanceType,
            imageId: this.connectorConfig.imageId,
            group: this.connectorConfig.tag,
            terminateOnShutdown: true,
            userData,
            zone: this.connectorConfig.zone,
            projectId: this.connectorConfig.projectId,
        });
        const instances = await this.api.describeInstances({
            instancesIds: instancesIds, 
        });

        return instances.map((i) => convertToProxy(
            i,
            this.connectorConfig.port,
            this.connectorConfig.zone
        ));
    }

    public async startProxies(keys: string[]): Promise<void> {
        this.logger.debug(`startProxies(): keys.length=${keys.length}`);

        await this.api.startInstances(keys);
    }

    public async removeProxies(keys: IProxyKeyToRemove[]): Promise<string[]> {
        this.logger.debug(`removeProxies(): keys.length=${keys.length}`);

        const proxiesKeys = keys.map((p) => p.key);
        await this.api.terminateInstances(proxiesKeys);

        return [];
    }
}
