import { Logger } from '@nestjs/common';
import {
    Agents,
    ScriptBuilder,
} from '@scrapoxy/backend-sdk';
import { randomName } from '@scrapoxy/common';
import { OvhApi } from './api';
import { convertToProxy } from './ovh.helpers';
import type {
    IConnectorOvhConfig,
    IConnectorOvhCredential,
} from './ovh.interface';
import type { IConnectorService } from '@scrapoxy/backend-sdk';
import type {
    ICertificate,
    IConnectorProxyRefreshed,
    IProxyKeyToRemove,
} from '@scrapoxy/common';


export class ConnectorOvhService implements IConnectorService {
    private readonly logger = new Logger(ConnectorOvhService.name);

    private readonly api: OvhApi;

    constructor(
        credentialConfig: IConnectorOvhCredential,
        private readonly connectorConfig: IConnectorOvhConfig,
        private readonly certificate: ICertificate,
        agents: Agents
    ) {
        this.api = new OvhApi(
            credentialConfig.appKey,
            credentialConfig.appSecret,
            credentialConfig.consumerKey,
            agents
        );
    }

    async getProxies(): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug('getProxies()');

        const instances = await this.api.getAllInstances(
            this.connectorConfig.projectId,
            this.connectorConfig.region
        );

        return instances
            .filter((i) => i.name.startsWith(`${this.connectorConfig.tag}-`))
            .map((i) => convertToProxy(
                i,
                this.connectorConfig.port,
                this.connectorConfig.region
            ));
    }

    async createProxies(count: number): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`createProxies(): count=${count}`);

        // Find image
        const images = await this.api.getAllImages(
            this.connectorConfig.projectId,
            this.connectorConfig.region
        );
        const image = images.find((i) => i.name === 'Ubuntu 24.04');

        if (!image) {
            throw new Error('Cannot find Ubuntu 24.04 image');
        }

        const userData = await new ScriptBuilder(
            this.connectorConfig.port,
            this.certificate,
            'amd64'
        )
            .build();
        const instances = await this.api.createInstances({
            projectId: this.connectorConfig.projectId,
            region: this.connectorConfig.region,
            name: `${this.connectorConfig.tag}-${randomName()}`,
            flavorId: this.connectorConfig.flavorId,
            imageId: image.id,
            userData,
            count,
        });

        return instances.map((i) => convertToProxy(
            i,
            this.connectorConfig.port,
            this.connectorConfig.region
        ));
    }

    async startProxies(keys: string[]): Promise<void> {
        this.logger.debug(`startProxies(): keys.length=${keys.length}`);

        await Promise.all(keys.map((key) => this.api.startInstance(
            this.connectorConfig.projectId,
            key
        )));
    }

    async removeProxies(keys: IProxyKeyToRemove[]): Promise<string[]> {
        this.logger.debug(`removeProxies(): keys.length=${keys.length}`);

        await Promise.all(keys.map((p) => this.api.removeInstance(
            this.connectorConfig.projectId,
            p.key
        )));

        return [];
    }
}
