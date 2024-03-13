import { Logger } from '@nestjs/common';
import { Agents } from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_PROXY_SELLER_SERVER_TYPE,
    EProxySellerNetworkType,
    EProxyStatus,
    EProxyType,
} from '@scrapoxy/common';
import { ProxySellerServerApi } from './api';
import { EProxySellerProxyProtocol } from './ps-server.interface';
import type {
    IConnectorProxySellerServerConfig,
    IConnectorProxySellerServerCredential,
    IProxySellerProxy,
} from './ps-server.interface';
import type { IConnectorService } from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IProxyKeyToRemove,
    IProxyTransport,
} from '@scrapoxy/common';


function getName(proxy: IProxySellerProxy): string {
    switch (proxy.networkType) {
        case EProxySellerNetworkType.IPV4: {
            return `DC${proxy.id}`;
        }

        case EProxySellerNetworkType.ISP: {
            return `ISP${proxy.id}`;
        }

        case EProxySellerNetworkType.MOBILE: {
            return `MOB${proxy.id}`;
        }

        default: {
            throw new Error(`Unknown network type: ${proxy.networkType} for proxy ${proxy.id}`);
        }
    }
}


function convertToProxy(proxy: IProxySellerProxy): IConnectorProxyRefreshed | undefined {
    if (!proxy) {
        return;
    }

    let
        port: number | null,
        proxyType: EProxyType;
    switch (proxy.protocol) {
        case EProxySellerProxyProtocol.HTTP: {
            proxyType = EProxyType.HTTP;
            port = proxy.port_http;
            break;
        }

        case EProxySellerProxyProtocol.SOCKS: {
            proxyType = EProxyType.SOCKS5;
            port = proxy.port_socks;
            break;
        }

        default: {
            throw new Error(`Unknown proxy protocol: ${proxy.protocol} for proxy ${proxy.id}`);
        }
    }

    if (!port) {
        throw new Error(`Port is undefined for proxy ${proxy.id}`);
    }

    const config: IProxyTransport = {
        type: proxyType,
        address: {
            hostname: proxy.ip_only,
            port,
        },
        auth: {
            username: proxy.login,
            password: proxy.password,
        },
    };
    const p: IConnectorProxyRefreshed = {
        type: CONNECTOR_PROXY_SELLER_SERVER_TYPE,
        key: proxy.id.toString(),
        name: getName(proxy),
        status: EProxyStatus.STARTED,
        config,
    };

    return p;
}


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

        const proxies = await this.api.getAllProxies(
            this.connectorConfig.networkType,
            this.connectorConfig.country
        );
        const proxiesFiltered = proxies
            .map(convertToProxy)
            .filter((p) => p && keys.includes(p.key));

        return proxiesFiltered as IConnectorProxyRefreshed[];
    }

    async createProxies(
        count: number, totalCount: number, excludeKeys: string[]
    ): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`createProxies(): count=${count} / totalCount=${totalCount} / excludeKeys.length=${excludeKeys.length}`);

        const proxies = await this.api.getAllProxies(
            this.connectorConfig.networkType,
            this.connectorConfig.country
        );
        const proxiesFiltered = proxies
            .map(convertToProxy)
            .filter((p) => p && !excludeKeys.includes(p.key))
            .slice(
                0,
                count
            );

        return proxiesFiltered as IConnectorProxyRefreshed[];
    }

    async startProxies(): Promise<void> {
        // Not used
    }

    async removeProxies(keys: IProxyKeyToRemove[]): Promise<string[]> {
        this.logger.debug(`removeProxies(): keys.length=${keys.length}`);

        return keys.map((p) => p.key);
    }
}
