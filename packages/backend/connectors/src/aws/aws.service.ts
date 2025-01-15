import { Logger } from '@nestjs/common';
import { Agents } from '@scrapoxy/backend-sdk';
import { AwsApi } from './api';
import { convertToProxy } from './aws.helpers';
import type {
    IConnectorAwsConfig,
    IConnectorAwsCredential,
} from './aws.interface';
import type { IConnectorService } from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IProxyKeyToRemove,
} from '@scrapoxy/common';


export class ConnectorAwsService implements IConnectorService {
    private readonly logger = new Logger(ConnectorAwsService.name);

    private readonly api: AwsApi;

    constructor(
        credentialConfig: IConnectorAwsCredential,
        private readonly connectorConfig: IConnectorAwsConfig,
        agents: Agents
    ) {
        this.api = new AwsApi(
            credentialConfig.accessKeyId,
            credentialConfig.secretAccessKey,
            connectorConfig.region,
            agents
        );
    }

    async getProxies(): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug('getProxies()');

        const instances = await this.api.describeInstances({
            group: this.connectorConfig.tag,
            statesCodes: [
                '0',
                '16',
                '32',
                '64',
                '80',
            ],
        });

        return instances.map((i) => convertToProxy(
            i,
            this.connectorConfig.port,
            this.connectorConfig.region
        ));
    }

    async createProxies(count: number): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`createProxies(): count=${count}`);

        const instances = await this.api.runInstances({
            count,
            instanceType: this.connectorConfig.instanceType,
            imageId: this.connectorConfig.imageId,
            securityGroup: this.connectorConfig.securityGroupName,
            group: this.connectorConfig.tag,
            terminateOnShutdown: true,
        });

        return instances.map((i) => convertToProxy(
            i,
            this.connectorConfig.port,
            this.connectorConfig.region
        ));
    }

    async startProxies(keys: string[]): Promise<void> {
        this.logger.debug(`startProxies(): keys.length=${keys.length}`);

        await this.api.startInstances(keys);
    }

    async removeProxies(keys: IProxyKeyToRemove[]): Promise<string[]> {
        this.logger.debug(`removeProxies(): keys.length=${keys.length}`);

        const proxiesKeys = keys.map((p) => p.key);

        await this.api.terminateInstances(proxiesKeys);

        return [];
    }
}
