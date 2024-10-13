import { Logger } from '@nestjs/common';
import {
    Agents,
    TRANSPORT_PROXY_TYPE,
} from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_IPROYAL_SERVER_TYPE,
    EProxyStatus,
    EProxyType,
} from '@scrapoxy/common';
import { IproyalServerApi } from './api';
import type {
    IConnectorIproyalServerConfig,
    IConnectorIproyalServerCredential,
    IIproyalServerProxy,
} from './iproyal-server.interface';
import type { IConnectorService } from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IProxyKeyToRemove,
    IProxyTransport,
} from '@scrapoxy/common';


function convertToProxy(proxy: IIproyalServerProxy): IConnectorProxyRefreshed | undefined {
    if (!proxy?.ip_address || proxy.ip_address.length <= 0 ||
        !proxy.port || proxy.port <= 0 ||
        !proxy.username || proxy.username.length <= 0 ||
        !proxy.password || proxy.password.length <= 0) {
        return;
    }

    const config: IProxyTransport = {
        type: EProxyType.HTTP,
        address: {
            hostname: proxy.ip_address,
            port: proxy.port,
        },
        auth: {
            username: proxy.username,
            password: proxy.password,
        },
    };
    const key = proxy.id.toString();
    const p: IConnectorProxyRefreshed = {
        type: CONNECTOR_IPROYAL_SERVER_TYPE,
        transportType: TRANSPORT_PROXY_TYPE,
        key,
        name: key,
        status: EProxyStatus.STARTED,
        config,
    };

    return p;
}


export class ConnectorIproyalService implements IConnectorService {
    private readonly logger = new Logger(ConnectorIproyalService.name);

    private readonly api: IproyalServerApi;

    constructor(
        credentialConfig: IConnectorIproyalServerCredential,
        private readonly connectorConfig: IConnectorIproyalServerConfig,
        agents: Agents
    ) {
        this.api = new IproyalServerApi(
            credentialConfig.token,
            agents
        );
    }

    async getProxies(keys: string[]): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`getProxies(): keys.length=${keys.length}`);

        const proxies = await this.api.getAllProxies(
            this.connectorConfig.product,
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
            this.connectorConfig.product,
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
