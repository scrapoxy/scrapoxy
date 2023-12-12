import { Logger } from '@nestjs/common';
import { Agents } from '@scrapoxy/backend-sdk';
import {
    EProxyStatus,
    randomNames,
    safeJoin,
} from '@scrapoxy/common';
import { CONNECTOR_DIGITALOCEAN_TYPE } from '@scrapoxy/connector-digitalocean-sdk';
import { DigitalOceanApi } from './api';
import { getDigitalOceanPublicAddress } from './digitalocean.helpers';
import { EDigitalOceanDropletStatus } from './digitalocean.interface';
import type {
    IConnectorDigitalOceanConfig,
    IConnectorDigitalOceanCredential,
    IDigitalOceanDroplet,
} from './digitalocean.interface';
import type {
    IConnectorService,
    ITransportProxyRefreshedConfigCloud,
} from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IProxyKeyToRemove,
} from '@scrapoxy/common';


function convertStatus(status: EDigitalOceanDropletStatus): EProxyStatus {
    if (!status) {
        return EProxyStatus.ERROR;
    }

    switch (status) {
        case EDigitalOceanDropletStatus.NEW:
            return EProxyStatus.STARTING;
        case EDigitalOceanDropletStatus.ACTIVE:
            return EProxyStatus.STARTED;
        case EDigitalOceanDropletStatus.OFF:
            return EProxyStatus.STOPPED;
        default:
            return EProxyStatus.ERROR;
    }
}


function convertToProxy(
    droplet: IDigitalOceanDroplet, port: number
): IConnectorProxyRefreshed {
    const hostname = getDigitalOceanPublicAddress(droplet);
    const config: ITransportProxyRefreshedConfigCloud = {
        address: hostname ? {
            hostname,
            port,
        } : void 0,
    };
    const proxy: IConnectorProxyRefreshed = {
        type: CONNECTOR_DIGITALOCEAN_TYPE,
        key: droplet.id.toString(10),
        name: droplet.name,
        config,
        status: convertStatus(droplet.status),
    };

    return proxy;
}


export class ConnectorDigitaloceanService implements IConnectorService {
    private readonly logger = new Logger(ConnectorDigitaloceanService.name);

    private readonly api: DigitalOceanApi;

    constructor(
        credentialConfig: IConnectorDigitalOceanCredential,
        private readonly connectorConfig: IConnectorDigitalOceanConfig,
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

        const snapshotId = parseInt(this.connectorConfig.snapshotId);
        const droplets = await this.api.createDroplets({
            names: randomNames(count),
            region: this.connectorConfig.region,
            size: this.connectorConfig.size,
            snapshotId: snapshotId,
            tags: [
                this.connectorConfig.tag,
            ],
        });

        return droplets.map((d) => convertToProxy(
            d,
            this.connectorConfig.port
        ));
    }

    async startProxies(keys: string[]): Promise<void> {
        this.logger.debug(`startProxies(): keys=${safeJoin(keys)}`);

        await Promise.all(keys.map((key) =>
            this.api.powerOnDroplet(parseInt(key))));
    }

    async removeProxies(keys: IProxyKeyToRemove[]): Promise<string[]> {
        this.logger.debug(`removeProxies(): keys=${safeJoin(keys.map((p) => p.key))}`);

        await Promise.all(keys.map((key) =>
            this.api.deleteDroplet(parseInt(key.key))));

        return [];
    }
}
