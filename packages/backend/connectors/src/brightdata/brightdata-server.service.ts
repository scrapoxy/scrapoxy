import { Logger } from '@nestjs/common';
import { Agents } from '@scrapoxy/backend-sdk';
import { BrightdataApi } from './api';
import {
    convertToProxy,
    getBrightdataPrefix,
} from './brightdata.helpers';
import { TRANSPORT_BRIGHTDATA_SERVER_TYPE } from './transport';
import type {
    IConnectorBrightdataConfig,
    IConnectorBrightdataCredential,
} from './brightdata.interface';
import type { IConnectorService } from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IProxyKeyToRemove,
} from '@scrapoxy/common';


export class ConnectorBrightdataServerService implements IConnectorService {
    private readonly logger = new Logger(ConnectorBrightdataServerService.name);

    private readonly api: BrightdataApi;

    constructor(
        credentialConfig: IConnectorBrightdataCredential,
        private readonly connectorConfig: IConnectorBrightdataConfig,
        agents: Agents
    ) {
        this.api = new BrightdataApi(
            credentialConfig.token,
            agents
        );
    }

    async getProxies(keys: string[]): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`getProxies(): keys.length=${keys.length}`);

        const proxies = await this.getActiveProxies();
        const proxiesFiltered = proxies.filter((p) => keys.includes(p.key));

        return proxiesFiltered;
    }

    async createProxies(
        count: number, totalCount: number, excludeKeys: string[]
    ): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`createProxies(): count=${count} / totalCount=${totalCount} / excludeKeys.length=${excludeKeys.length}`);

        const proxies = await this.getActiveProxies();
        const proxiesFiltered = proxies
            .filter((p) => !excludeKeys.includes(p.key))
            .slice(
                0,
                count
            );

        return proxiesFiltered;
    }

    async startProxies(): Promise<void> {
        // Not used
    }

    async removeProxies(keys: IProxyKeyToRemove[]): Promise<string[]> {
        this.logger.debug(`removeProxies(): keys.length=${keys.length}`);

        const ipsForced = keys.filter((k) => k.force)
            .map((k) => k.key.slice(3));

        if (ipsForced.length > 0) {
            if (this.connectorConfig.country === 'all') {
                await this.api.refreshStaticIps(
                    this.connectorConfig.zoneName,
                    ipsForced
                );
            } else {
                await this.api.refreshStaticIps(
                    this.connectorConfig.zoneName,
                    ipsForced,
                    this.connectorConfig.country
                );
            }
        }

        return keys.map((k) => k.key);
    }

    private async getActiveProxies(): Promise<IConnectorProxyRefreshed[]> {
        const ips = await this.api.getZoneRouteIps(this.connectorConfig.zoneName);
        const prefix = getBrightdataPrefix(this.connectorConfig.productType);
        const proxies = ips
            .map((ip) => convertToProxy(
                `${prefix}${ip}`,
                TRANSPORT_BRIGHTDATA_SERVER_TYPE,
                this.connectorConfig.username,
                this.connectorConfig.password,
                this.connectorConfig.country
            ));

        return proxies;
    }
}
