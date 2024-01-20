import { Logger } from '@nestjs/common';
import { Agents } from '@scrapoxy/backend-sdk';
import {
    EProxyStatus,
    safeJoin,
} from '@scrapoxy/common';
import { CONNECTOR_AWS_TYPE } from '@scrapoxy/connector-aws-sdk';
import { AwsApi } from './api';
import type {
    IConnectorAwsConfig,
    IConnectorAwsCredential,
} from './aws.interface';
import type {
    IConnectorService,
    ITransportProxyRefreshedConfigDatacenter,
} from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IProxyKeyToRemove,
} from '@scrapoxy/common';


function convertStatus(code: string): EProxyStatus {
    switch (code) {
        case '0':
            return EProxyStatus.STARTING;
        case '16':
            return EProxyStatus.STARTED;
        case '32':
        case '64':
            return EProxyStatus.STOPPING;
        case '80':
            return EProxyStatus.STOPPED;
        default:
            return EProxyStatus.ERROR;
    }
}


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

        return instances.map((i) => {
            const config: ITransportProxyRefreshedConfigDatacenter = {
                address: i.ipAddress && i.ipAddress.length > 0 ? {
                    hostname: i.ipAddress[ 0 ],
                    port: this.connectorConfig.port,
                } : void 0,
            };
            const proxy: IConnectorProxyRefreshed = {
                type: CONNECTOR_AWS_TYPE,
                key: i.instanceId[ 0 ],
                name: i.instanceId[ 0 ],
                config,
                status: convertStatus(i.instanceState[ 0 ].code[ 0 ]),
            };

            return proxy;
        });
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

        return instances.map((i) => {
            const config: ITransportProxyRefreshedConfigDatacenter = {
                address: i.ipAddress && i.ipAddress.length > 0 ? {
                    hostname: i.ipAddress[ 0 ],
                    port: this.connectorConfig.port,
                } : void 0,
            };
            const proxy: IConnectorProxyRefreshed = {
                type: CONNECTOR_AWS_TYPE,
                key: i.instanceId[ 0 ],
                name: i.instanceId[ 0 ],
                config,
                status: convertStatus(i.instanceState[ 0 ].code[ 0 ]),
            };

            return proxy;
        });
    }

    async startProxies(keys: string[]): Promise<void> {
        this.logger.debug(`startProxies(): keys=${safeJoin(keys)}`);

        await this.api.startInstances(keys);
    }

    async removeProxies(keys: IProxyKeyToRemove[]): Promise<string[]> {
        const proxiesKeys = keys.map((p) => p.key);
        this.logger.debug(`removeProxies(): keys=${safeJoin(proxiesKeys)}`);

        await this.api.terminateInstances(proxiesKeys);

        return [];
    }
}
