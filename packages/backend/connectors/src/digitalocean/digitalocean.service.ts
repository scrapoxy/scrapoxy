import { Logger } from '@nestjs/common';
import {
    Agents,
    ScriptBuilder,
} from '@scrapoxy/backend-sdk';
import { randomNames } from '@scrapoxy/common';
import { DigitalOceanApi } from './api';
import { convertToProxy } from './digitalocean.helpers';
import { EDigitalOceanDropletStatus } from './digitalocean.interface';
import type {
    IConnectorDigitalOceanConfig,
    IConnectorDigitalOceanCredential,
} from './digitalocean.interface';
import type { IConnectorService } from '@scrapoxy/backend-sdk';
import type {
    ICertificate,
    IConnectorProxyRefreshed,
    IProxyKeyToRemove,
} from '@scrapoxy/common';


export class ConnectorDigitaloceanService implements IConnectorService {
    private readonly logger = new Logger(ConnectorDigitaloceanService.name);

    private readonly api: DigitalOceanApi;

    constructor(
        credentialConfig: IConnectorDigitalOceanCredential,
        private readonly connectorConfig: IConnectorDigitalOceanConfig,
        private readonly certificate: ICertificate,
        agents: Agents
    ) {
        this.api = new DigitalOceanApi(
            credentialConfig.token,
            agents
        );
    }

    async getProxies(): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug('getProxies()');

        const droplets = await this.api.getAllDroplets(this.connectorConfig.tag);

        return droplets
            .filter((d) => d.status !== EDigitalOceanDropletStatus.ARCHIVE)
            .map((d) => convertToProxy(
                d,
                this.connectorConfig.port
            ));
    }

    async createProxies(count: number): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`createProxies(): count=${count}`);

        const userData = await new ScriptBuilder(
            this.connectorConfig.port,
            this.certificate,
            'amd64'
        )
            .build();
        const droplets = await this.api.createDroplets({
            names: randomNames(count),
            region: this.connectorConfig.region,
            imageName: 'ubuntu-24-04-x64',
            size: this.connectorConfig.size,
            tags: [
                this.connectorConfig.tag,
            ],
            userData,
        });

        return droplets.map((d) => convertToProxy(
            d,
            this.connectorConfig.port
        ));
    }

    async startProxies(keys: string[]): Promise<void> {
        this.logger.debug(`startProxies(): keys.length=${keys.length}`);

        await Promise.all(keys.map((key) =>
            this.api.powerOnDroplet(parseInt(key))));
    }

    async removeProxies(keys: IProxyKeyToRemove[]): Promise<string[]> {
        this.logger.debug(`removeProxies(): keys.length=${keys.length}`);

        await Promise.all(keys.map((key) =>
            this.api.deleteDroplet(parseInt(key.key))));

        return [];
    }
}
