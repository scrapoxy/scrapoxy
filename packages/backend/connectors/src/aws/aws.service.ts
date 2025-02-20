import { Logger } from '@nestjs/common';
import {
    Agents,
    ScriptBuilder,
} from '@scrapoxy/backend-sdk';
import { AwsApi } from './api';
import { convertToProxy } from './aws.helpers';
import type {
    IConnectorAwsConfig,
    IConnectorAwsCredential,
} from './aws.interface';
import type { IConnectorService } from '@scrapoxy/backend-sdk';
import type {
    ICertificate,
    IConnectorProxyRefreshed,
    IProxyKeyToRemove,
} from '@scrapoxy/common';


export class ConnectorAwsService implements IConnectorService {
    private readonly logger = new Logger(ConnectorAwsService.name);

    private readonly api: AwsApi;

    constructor(
        credentialConfig: IConnectorAwsCredential,
        private readonly connectorConfig: IConnectorAwsConfig,
        private readonly certificate: ICertificate,
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

        // Find the instance type to get the architecture
        const instancesTypes = await this.api.describeInstancesTypes([
            this.connectorConfig.instanceType,
        ]);
        const architectures: string[] = [];
        for (const instanceType of instancesTypes) {
            for (const info of instanceType.processorInfo) {
                if (info?.supportedArchitectures) {
                    for (const architecture of info.supportedArchitectures) {
                        if (architecture?.item) {
                            architectures.push(...architecture.item);
                        }
                    }
                }
            }
        }

        let
            architecture: string,
            name: string;

        if (architectures.includes('arm64')) {
            architecture = 'arm64';
            name = 'ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-arm64-server-*';
        } else if (architectures.includes('x86_64')) {
            architecture = 'x86_64';
            name = 'ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*';
        } else {
            throw new Error(`Cannot find any architecture for the instance type ${this.connectorConfig.instanceType}`);
        }

        // Find the instance type
        const images = await this.api.describeImages({
            architecture,
            imageType: 'machine',
            isPublic: true,
            name,
            ownerAlias: 'amazon',
            state: 'available',
            virtualizationType: 'hvm',
        });

        if (images.length <= 0) {
            throw new Error('Cannot find any ubuntu 24.04 image');
        }

        const imagesSorted = images.sort((
            a, b
        ) => b.creationDate[ 0 ].localeCompare(a.creationDate[ 0 ]));
        const userData = await new ScriptBuilder(
            this.connectorConfig.port,
            this.certificate,
            architecture === 'arm64' ? 'arm64' : 'amd64'
        )
            .build();
        const instances = await this.api.runInstances({
            count,
            imageId: imagesSorted[ 0 ].imageId[ 0 ],
            instanceType: this.connectorConfig.instanceType,
            securityGroup: this.connectorConfig.securityGroupName,
            group: this.connectorConfig.tag,
            userData,
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
