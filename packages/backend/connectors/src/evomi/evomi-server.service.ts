import { Logger } from '@nestjs/common';
import {
    Agents,
    TRANSPORT_PROXY_TYPE,
} from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_EVOMI_TYPE,
    EProxyStatus,
    EProxyType,
    pickRandom,
} from '@scrapoxy/common';
import { EvomiApi } from './api';
import type {
    IConnectorEvomiConfig,
    IConnectorEvomiCredential,
    IEvomiProductServer,
} from './evomi.interface';
import type { IConnectorService } from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IProxyKeyToRemove,
    IProxyTransport,
} from '@scrapoxy/common';


export class ConnectorEvomiServerService implements IConnectorService {
    private readonly logger = new Logger(ConnectorEvomiServerService.name);

    private readonly api: EvomiApi;

    constructor(
        credentialConfig: IConnectorEvomiCredential,
        private readonly connectorConfig: IConnectorEvomiConfig,
        agents: Agents
    ) {
        this.api = new EvomiApi(
            credentialConfig.apiKey,
            agents
        );
    }

    async getProxies(keys: string[]): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`getProxies(): keys.length=${keys.length}`);

        const proxies = await this.getAllProxies();
        const proxiesFiltered = proxies
            .filter((p) => keys.includes(p.key));

        return proxiesFiltered;
    }

    async createProxies(
        count: number, totalCount: number, excludeKeys: string[]
    ): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`createProxies(): count=${count} / totalCount=${totalCount} / excludeKeys.length=${excludeKeys.length}`);

        const proxies = await this.getAllProxies();
        const proxiesFiltered = proxies
            .filter((p) => p && !excludeKeys.includes(p.key));
        const proxiesCut = pickRandom(
            proxiesFiltered,
            count
        );

        return proxiesCut as IConnectorProxyRefreshed[];
    }

    async startProxies(): Promise<void> {
        // Not used
    }

    async removeProxies(keys: IProxyKeyToRemove[]): Promise<string[]> {
        this.logger.debug(`removeProxies(): keys.length=${keys.length}`);

        return keys.map((p) => p.key);
    }

    private async getAllProxies(): Promise<IConnectorProxyRefreshed[]> {
        const product = await this.api.getProductResidential('static_residential') as IEvomiProductServer;
        const proxies: IConnectorProxyRefreshed[] = [];
        const now = new Date();
        for (const pkg of product.packages ?? []) {
            if (pkg.expiryDate && new Date(pkg.expiryDate) >= now) {
                for (const ip of pkg.ips ?? []) {
                    let countryLike: string | null;

                    if (this.connectorConfig.country === 'all') {
                        countryLike = null;
                    } else {
                        if (ip.ipInfo.country.toLowerCase() !== this.connectorConfig.country) {
                            continue;
                        }

                        countryLike = this.connectorConfig.country;
                    }

                    const key = `ISP${ip.ipInfo.ip}`;
                    const config: IProxyTransport = {
                        type: EProxyType.HTTP,
                        address: {
                            hostname: ip.ipInfo.ip,
                            port: product.ports.http,
                        },
                        auth: {
                            username: pkg.username,
                            password: ip.password,
                        },
                    };
                    const proxy: IConnectorProxyRefreshed = {
                        type: CONNECTOR_EVOMI_TYPE,
                        transportType: TRANSPORT_PROXY_TYPE,
                        key,
                        name: key,
                        status: EProxyStatus.STARTED,
                        removingForceCap: false,
                        config,
                        countryLike,
                    };

                    proxies.push(proxy);
                }
            }
        }

        return proxies;
    }
}
