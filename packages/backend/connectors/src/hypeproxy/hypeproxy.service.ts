import { Logger } from '@nestjs/common';
import {
    Agents,
    TRANSPORT_PROXY_TYPE,
} from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_HYPEPROXY_TYPE,
    EProxyStatus,
    EProxyType,
    pickRandom,
} from '@scrapoxy/common';
import { HypeproxyApi } from './api';
import type {
    IConnectorHypeproxyCredential,
    IHypeproxyProxy,
} from './hypeproxy.interface';
import type { IConnectorService } from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IProxyKeyToRemove,
    IProxyTransport,
} from '@scrapoxy/common';


export function convertToProxy(proxy: IHypeproxyProxy): IConnectorProxyRefreshed | undefined {
    const config: IProxyTransport = {
        type: EProxyType.HTTP,
        address: {
            hostname: proxy.hub,
            port: proxy.httpPort,
        },
        auth: {
            username: proxy.user,
            password: proxy.password,
        },
    };
    const p: IConnectorProxyRefreshed = {
        type: CONNECTOR_HYPEPROXY_TYPE,
        transportType: TRANSPORT_PROXY_TYPE,
        key: proxy.id,
        name: proxy.shortId,
        status: EProxyStatus.STARTED,
        config,
        removingForceCap: true,
        countryLike: 'fr', // They only have 4G mobile proxies in France
    };

    return p;
}


export class ConnectorHypeproxyService implements IConnectorService {
    private readonly logger = new Logger(ConnectorHypeproxyService.name);

    private readonly api: HypeproxyApi;

    constructor(
        credentialConfig: IConnectorHypeproxyCredential,
        agents: Agents
    ) {
        this.api = new HypeproxyApi(
            credentialConfig.token,
            agents
        );
    }

    async getProxies(keys: string[]): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`getProxies(): keys.length=${keys.length}`);

        const proxies = await this.api.getInformations();
        const proxiesFiltered = proxies
            .map(convertToProxy)
            .filter((p) => p && keys.includes(p.key));

        return proxiesFiltered as IConnectorProxyRefreshed[];

    }

    async createProxies(
        count: number, totalCount: number, excludeKeys: string[]
    ): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`createProxies(): count=${count} / totalCount=${totalCount} / excludeKeys.length=${excludeKeys.length}`);

        const proxies = await this.api.getInformations();
        const proxiesFiltered = proxies
            .map(convertToProxy)
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
        this.logger.debug(`removeProxies(): keys.length=${keys}`);

        const promises = keys
            .filter((p) => p.force)
            .map((p) => this.api.directRenewIp(p.key));

        await Promise.all(promises);

        return keys.map((p) => p.key);
    }
}
