import { Logger } from '@nestjs/common';
import { Agents } from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_NINJASPROXY_TYPE,
    EProxyStatus,
    EProxyType,
} from '@scrapoxy/common';
import { NinjasproxyApi } from './api';
import type {
    IConnectorNinjasproxyCredential,
    INinjasproxyProxy,
} from './ninjasproxy.interface';
import type { IConnectorService } from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IProxyKeyToRemove,
    IProxyTransport,
} from '@scrapoxy/common';


function convertToProxy(proxy: INinjasproxyProxy): IConnectorProxyRefreshed | undefined {
    if (!proxy.address) {
        return;
    }

    const arr = proxy.address.split(':');

    if (arr.length < 2) {
        return;
    }

    const [
        hostname, portRaw,
    ] = arr;
    let port: number;
    try {
        port = parseInt(
            portRaw,
            10
        );
    } catch (err: any) {
        return;
    }

    const config: IProxyTransport = {
        type: EProxyType.HTTP,
        address: {
            hostname,
            port,
        },
        auth: {
            username: proxy.username,
            password: proxy.password,
        },
    };
    const p: IConnectorProxyRefreshed = {
        type: CONNECTOR_NINJASPROXY_TYPE,
        key: proxy.address,
        name: proxy.address,
        status: EProxyStatus.STARTED,
        config,
    };

    return p;
}


export class ConnectorNinjasproxyService implements IConnectorService {
    private readonly logger = new Logger(ConnectorNinjasproxyService.name);

    private readonly api: NinjasproxyApi;

    constructor(
        credentialConfig: IConnectorNinjasproxyCredential,
        agents: Agents
    ) {
        this.api = new NinjasproxyApi(
            credentialConfig.apiKey,
            agents
        );
    }

    async getProxies(keys: string[]): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`getProxies(): keys.length=${keys.length}`);

        const proxies = await this.api.getAllProxies();
        const proxiesFiltered = proxies
            .map(convertToProxy)
            .filter((p) => p && keys.includes(p.key));

        return proxiesFiltered as IConnectorProxyRefreshed[];
    }

    async createProxies(
        count: number, totalCount: number, excludeKeys: string[]
    ): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`createProxies(): count=${count} / totalCount=${totalCount} / excludeKeys.length=${excludeKeys.length}`);

        const proxies = await this.api.getAllProxies();
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
