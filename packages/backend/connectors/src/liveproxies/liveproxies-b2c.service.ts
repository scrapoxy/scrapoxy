import { Logger } from '@nestjs/common';
import {
    Agents,
    TRANSPORT_PROXY_TYPE,
} from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_LIVEPROXIES_TYPE,
    EProxyStatus,
    EProxyType,
} from '@scrapoxy/common';
import { LiveproxiesApi } from './api';
import type {
    IConnectorLiveproxiesConfig,
    IConnectorLiveproxiesCredential,
    ILiveproxiesProxyList,
} from './liveproxies.interface';
import type { IConnectorService } from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IProxyKeyToRemove,
    IProxyTransport,
} from '@scrapoxy/common';


const DEFAULT_PORT = 7383;


function convertToProxy(
    key: string,
    proxyList: ILiveproxiesProxyList
): IConnectorProxyRefreshed {
    const config: IProxyTransport = {
        type: EProxyType.HTTP,
        address: {
            hostname: proxyList.serverIp,
            port: DEFAULT_PORT,
        },
        auth: {
            username: `${proxyList.loginName}-${proxyList.accessPoint}-${key}`,
            password: proxyList.loginPassword,
        },
    };

    return {
        type: CONNECTOR_LIVEPROXIES_TYPE,
        key,
        name: key,
        transportType: TRANSPORT_PROXY_TYPE,
        config,
        status: EProxyStatus.STARTED,
        removingForceCap: false,
        countryLike: null,
    };
}


export class ConnectorLiveproxiesB2cService implements IConnectorService {
    private readonly logger = new Logger(ConnectorLiveproxiesB2cService.name);

    private readonly api: LiveproxiesApi;

    constructor(
        credentialConfig: IConnectorLiveproxiesCredential,
        private readonly connectorConfig: IConnectorLiveproxiesConfig,
        agents: Agents
    ) {
        this.api = new LiveproxiesApi(
            credentialConfig.apiKey,
            agents
        );
    }

    async getProxies(keys: string[]): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`getProxies(): keys.length=${keys.length}`);

        const proxyList = await this.api.getProxyList(this.connectorConfig.packageId);
        const proxies: IConnectorProxyRefreshed[] = keys.map((key) => convertToProxy(
            key,
            proxyList
        ));

        return proxies;
    }

    async createProxies(
        count: number, totalCount: number, excludeKeys: string[]
    ): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`createProxies(): count=${count} / totalCount=${totalCount} / excludeKeys.length=${excludeKeys.length}`);

        const proxyList = await this.api.getProxyList(this.connectorConfig.packageId);
        const excludeKeysSet = new Set<string>(excludeKeys);
        const availableKeys: string[] = [];
        for (let proxyId = 1; proxyId <= proxyList.ipQuantity; proxyId++) {
            const key = proxyId.toString();

            if (!excludeKeysSet.has(key)) {
                availableKeys.push(key);
            }
        }

        const newProxies: IConnectorProxyRefreshed[] = [];
        while (newProxies.length < count && availableKeys.length > 0) {
            const randomKeyIndex = Math.floor(Math.random() * availableKeys.length);
            const key = availableKeys[ randomKeyIndex ];
            availableKeys.splice(
                randomKeyIndex,
                1
            );

            const proxy = convertToProxy(
                key,
                proxyList
            );

            newProxies.push(proxy);
        }

        return newProxies;
    }

    async startProxies(): Promise<void> {
        // Not used
    }

    async removeProxies(keys: IProxyKeyToRemove[]): Promise<string[]> {
        this.logger.debug(`removeProxies(): keys.length=${keys.length}`);

        return keys.map((p) => p.key);
    }
}
