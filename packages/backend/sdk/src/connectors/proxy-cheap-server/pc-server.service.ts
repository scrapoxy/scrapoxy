import { Logger } from '@nestjs/common';
import {
    CONNECTOR_PROXY_CHEAP_SERVER_TYPE,
    EProxyStatus,
    EProxyType,
    safeJoin,
} from '@scrapoxy/common';
import { ProxyCheapServerApi } from './api';
import {
    EProxyCheapNetworkType,
    EProxyCheapProxyType,
} from './pc-server.interface';
import { Agents } from '../../helpers';
import type {
    IConnectorProxyCheapServerConfig,
    IConnectorProxyCheapServerCredential,
    IProxyCheapProxy,
} from './pc-server.interface';
import type { IConnectorService } from '../providers.interface';
import type {
    IConnectorProxyRefreshed,
    IProxyKeyToRemove,
    IProxyTransport,
} from '@scrapoxy/common';


function getName(proxy: IProxyCheapProxy): string {
    switch (proxy.networkType) {
        case EProxyCheapNetworkType.DATACENTER: {
            return `DC${proxy.id}`;
        }

        case EProxyCheapNetworkType.RESIDENTIAL_STATIC: {
            return `ISP${proxy.id}`;
        }

        case EProxyCheapNetworkType.MOBILE: {
            return `MOB${proxy.id}`;
        }

        default: {
            throw new Error(`Unknown network type: ${proxy.networkType} for proxy ${proxy.id}`);
        }
    }
}


function convertToProxy(proxy: IProxyCheapProxy): IConnectorProxyRefreshed | undefined {
    if (!proxy) {
        return;
    }

    let
        port: number | null,
        proxyType: EProxyType;
    switch (proxy.proxyType) {
        case EProxyCheapProxyType.HTTP: {
            proxyType = EProxyType.HTTP;
            port = proxy.connection.httpPort;
            break;
        }

        case EProxyCheapProxyType.HTTPS: {
            proxyType = EProxyType.HTTP; // Force HTTP port
            port = proxy.connection.httpsPort;
            break;
        }

        case EProxyCheapProxyType.SOCKS5: {
            proxyType = EProxyType.SOCKS5;
            port = proxy.connection.socks5Port;
            break;
        }

        default: {
            throw new Error(`Unknown proxy type: ${proxy.proxyType} for proxy ${proxy.id}`);
        }
    }

    if (!port) {
        throw new Error(`Port is undefined for proxy ${proxy.id}`);
    }

    const config: IProxyTransport = {
        type: proxyType,
        address: {
            hostname: proxy.connection.connectIp,
            port,
        },
        auth: {
            username: proxy.authentication.username,
            password: proxy.authentication.password,
        },
    };
    const p: IConnectorProxyRefreshed = {
        type: CONNECTOR_PROXY_CHEAP_SERVER_TYPE,
        key: proxy.id.toString(),
        name: getName(proxy),
        status: EProxyStatus.STARTED,
        config,
    };

    return p;
}


export class ConnectorProxyCheapService implements IConnectorService {
    private readonly logger = new Logger(ConnectorProxyCheapService.name);

    private readonly api: ProxyCheapServerApi;

    constructor(
        credentialConfig: IConnectorProxyCheapServerCredential,
        private readonly connectorConfig: IConnectorProxyCheapServerConfig,
        agents: Agents
    ) {
        this.api = new ProxyCheapServerApi(
            credentialConfig.key,
            credentialConfig.secret,
            agents
        );
    }

    async getProxies(keys: string[]): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`getProxies(): keys=${safeJoin(keys)}`);

        const proxies = await this.api.getAllProxies(this.connectorConfig.networkType);
        const proxiesFiltered = proxies
            .map(convertToProxy)
            .filter((p) => p && keys.includes(p.key));

        return proxiesFiltered as IConnectorProxyRefreshed[];
    }

    async createProxies(
        count: number, excludeKeys: string[]
    ): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`createProxies(): count=${count} / excludeKeys=${safeJoin(excludeKeys)}`);

        const proxies = await this.api.getAllProxies(this.connectorConfig.networkType);
        const proxiesFiltered = proxies
            .map(convertToProxy)
            .filter((p) => p && !excludeKeys.includes(p.key))
            .slice(
                0,
                count
            );

        return proxiesFiltered as IConnectorProxyRefreshed[];
    }

    async startProxies(keys: string[]): Promise<void> {
        this.logger.debug(`startProxies(): keys=${safeJoin(keys)}`);

        // Not used
    }

    async removeProxies(keys: IProxyKeyToRemove[]): Promise<string[]> {
        const proxiesKeys = keys.map((p) => p.key);
        this.logger.debug(`removeProxies(): keys=${safeJoin(proxiesKeys)}`);

        return proxiesKeys;
    }
}
