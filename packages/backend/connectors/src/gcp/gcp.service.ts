import { Logger } from '@nestjs/common';
import {
    Agents,
    ScriptBuilder,
} from '@scrapoxy/backend-sdk';
import { randomNames } from '@scrapoxy/common';
import { GcpApi } from './api';
import { convertToProxy } from './gcp.helpers';
import type {
    IConnectorGcpConfig,
    IConnectorGcpCredential,
} from './gcp.interface';
import type { IConnectorService } from '@scrapoxy/backend-sdk';
import type {
    ICertificate,
    IConnectorProxyRefreshed,
    IProxyKeyToRemove,
} from '@scrapoxy/common';


export class ConnectorGcpService implements IConnectorService {
    private readonly logger = new Logger(ConnectorGcpService.name);

    private readonly api: GcpApi;

    constructor(
        credentialConfig: IConnectorGcpCredential,
        private readonly connectorConfig: IConnectorGcpConfig,
        private readonly certificate: ICertificate,
        agents: Agents
    ) {
        this.api = new GcpApi(
            credentialConfig.projectId,
            credentialConfig.clientEmail,
            credentialConfig.privateKeyId,
            credentialConfig.privateKey,
            agents
        );
    }

    async getProxies(): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug('getProxies()');

        const instances = await this.api.listInstances(
            this.connectorConfig.zone,
            this.connectorConfig.label
        );

        return instances.map((i) => convertToProxy(
            i,
            this.connectorConfig.port,
            this.connectorConfig.zone
        ));
    }

    async createProxies(count: number): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`createProxies(): count=${count}`);

        const startupScript = await new ScriptBuilder(
            this.connectorConfig.port,
            this.certificate,
            'amd64'
        )
            .build();
        await this.api.bulkInsertInstances({
            diskSizeGb: '10',
            diskType: 'pd-standard',
            instancesNames: randomNames(count),
            labelName: this.connectorConfig.label,
            templateName: this.connectorConfig.templateName,
            machineType: this.connectorConfig.machineType,
            networkName: this.connectorConfig.networkName,
            startupScript,
            sourceImage: 'projects/debian-cloud/global/images/family/debian-12',
            zone: this.connectorConfig.zone,
        });

        return [];
    }

    async startProxies(keys: string[]): Promise<void> {
        this.logger.debug(`startProxies(): keys.length=${keys.length}`);

        await Promise.all(keys.map((key) => this.api.startInstance(
            this.connectorConfig.zone,
            key
        )));
    }

    async removeProxies(keys: IProxyKeyToRemove[]): Promise<string[]> {
        this.logger.debug(`removeProxies(): keys.length=${keys.length}`);

        await Promise.all(keys.map((p) => this.api.deleteInstance(
            this.connectorConfig.zone,
            p.key
        )));

        return [];
    }
}
