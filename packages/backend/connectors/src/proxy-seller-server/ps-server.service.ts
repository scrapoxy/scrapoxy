import { Logger } from '@nestjs/common';
import { Agents } from '@scrapoxy/backend-sdk';
import {
    convertIso3ToIso2,
    pickRandom,
} from '@scrapoxy/common';
import { ProxySellerServerApi } from './api';
import { convertToProxy } from './ps-server.helpers';
import type {
    IConnectorProxySellerServerConfig,
    IConnectorProxySellerServerCredential,
} from './ps-server.interface';
import type { IConnectorService } from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IProxyKeyToRemove,
} from '@scrapoxy/common';


export class ConnectorProxySellerServerService implements IConnectorService {
    private readonly logger = new Logger(ConnectorProxySellerServerService.name);

    private readonly api: ProxySellerServerApi;

    constructor(
        credentialConfig: IConnectorProxySellerServerCredential,
        private readonly connectorConfig: IConnectorProxySellerServerConfig,
        agents: Agents
    ) {
        this.api = new ProxySellerServerApi(
            credentialConfig.token,
            agents
        );
    }

    async getProxies(keys: string[]): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`getProxies(): keys.length=${keys.length}`);

        const country = convertIso3ToIso2(this.connectorConfig.country) ?? 'all';
        const proxies = await this.api.getAllProxies(
            this.connectorConfig.networkType,
            this.connectorConfig.country !== 'all' ? this.connectorConfig.country.toUpperCase() : void 0
        );
        const proxiesFiltered = proxies
            .map((p) => convertToProxy(
                p,
                country
            ))
            .filter((p) => p && keys.includes(p.key));

        return proxiesFiltered as IConnectorProxyRefreshed[];
    }

    async createProxies(
        count: number, totalCount: number, excludeKeys: string[]
    ): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`createProxies(): count=${count} / totalCount=${totalCount} / excludeKeys.length=${excludeKeys.length}`);

        const country = convertIso3ToIso2(this.connectorConfig.country) ?? 'all';
        const proxies = await this.api.getAllProxies(
            this.connectorConfig.networkType,
            this.connectorConfig.country !== 'all' ? this.connectorConfig.country.toUpperCase() : void 0
        );
        const proxiesFiltered = proxies
            .map((p) => convertToProxy(
                p,
                country
            ))
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
}
