import { Logger } from '@nestjs/common';
import {
    Agents,
    Cache,
    TRANSPORT_PROXY_TYPE,
} from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_IPROYAL_SERVER_TYPE,
    EProxyStatus,
    EProxyType,
    getCountryCode,
} from '@scrapoxy/common';
import { IproyalServerApi } from './api';
import type {
    IConnectorIproyalServerConfig,
    IConnectorIproyalServerCredential,
} from './iproyal-server.interface';
import type { IConnectorService } from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IProxyKeyToRemove,
    IProxyTransport,
} from '@scrapoxy/common';


export class ConnectorIproyalService implements IConnectorService {
    private readonly logger = new Logger(ConnectorIproyalService.name);

    private readonly api: IproyalServerApi;

    constructor(
        credentialConfig: IConnectorIproyalServerCredential,
        private readonly connectorConfig: IConnectorIproyalServerConfig,
        agents: Agents,
        cache: Cache
    ) {
        this.api = new IproyalServerApi(
            credentialConfig.token,
            agents,
            cache
        );
    }

    async getProxies(keys: string[]): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`getProxies(): keys.length=${keys.length}`);

        const proxies = await this.getAllProxies();
        const proxiesFiltered = proxies
            .filter((p) => p && keys.includes(p.key));

        return proxiesFiltered;
    }

    async createProxies(
        count: number, totalCount: number, excludeKeys: string[]
    ): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`createProxies(): count=${count} / totalCount=${totalCount} / excludeKeys.length=${excludeKeys.length}`);

        const proxies = await this.getAllProxies();
        const proxiesFiltered = proxies
            .filter((p) => p && !excludeKeys.includes(p.key));
        // Get random count of proxies
        const proxiesRandom = proxiesFiltered
            .sort(() => Math.random() - 0.5);
        const proxiesCut = proxiesRandom.slice(
            0,
            count
        );

        return proxiesCut;
    }

    async startProxies(): Promise<void> {
        // Not used
    }

    async removeProxies(keys: IProxyKeyToRemove[]): Promise<string[]> {
        this.logger.debug(`removeProxies(): keys.length=${keys.length}`);

        return keys.map((p) => p.key);
    }

    private async getAllProxies(): Promise<IConnectorProxyRefreshed[]> {
        let countryLike: string | null;

        if (this.connectorConfig.country !== 'all') {
            countryLike = getCountryCode(this.connectorConfig.country) ?? null;
        } else {
            countryLike = null;
        }

        const proxies: IConnectorProxyRefreshed[] = [];
        const orders = await this.api.getAllOrders(this.connectorConfig.productId);
        for (const order of orders) {
            if (this.connectorConfig.country !== 'all' && this.connectorConfig.country !== order.location) {
                continue;
            }

            const port = order.proxy_data.ports[ 'http|https' ];

            for (const proxy of order.proxy_data.proxies) {
                const key = `${proxy.ip}:${port}`;
                const config: IProxyTransport = {
                    type: EProxyType.HTTP,
                    address: {
                        hostname: proxy.ip,
                        port,
                    },
                    auth: {
                        username: proxy.username,
                        password: proxy.password,
                    },
                };

                proxies.push({
                    type: CONNECTOR_IPROYAL_SERVER_TYPE,
                    transportType: TRANSPORT_PROXY_TYPE,
                    key,
                    name: key,
                    status: EProxyStatus.STARTED,
                    removingForceCap: false,
                    config,
                    countryLike,
                });
            }
        }

        return proxies;
    }
}
