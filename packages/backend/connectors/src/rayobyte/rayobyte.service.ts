import { Logger } from '@nestjs/common';
import {
    Agents,
    TRANSPORT_PROXY_TYPE,
} from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_RAYOBYTE_TYPE,
    EProxyStatus,
    EProxyType,
    pickRandom,
} from '@scrapoxy/common';
import { RayobyteApi } from './api';
import type {
    IConnectorRayobyteConfig,
    IConnectorRayobyteCredential,
} from './rayobyte.interface';
import type { IConnectorService } from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IProxyKeyToRemove,
    IProxyTransport,
} from '@scrapoxy/common';


export function convertToProxy(
    line: string,
    packageFilter: any
): IConnectorProxyRefreshed | undefined {
    if (!line) {
        return;
    }

    const arr = line.split(':');

    if (arr.length < 4) {
        return;
    }

    const [
        hostname,
        portRaw,
        username,
        password,
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

    let countryLike: string | null;

    if (packageFilter === 'all') {
        countryLike = null;
    } else {
        countryLike = packageFilter.split('-')[ 0 ];
    }

    const config: IProxyTransport = {
        type: EProxyType.HTTP,
        address: {
            hostname,
            port,
        },
        auth: {
            username,
            password,
        },
    };
    const name = `${hostname}:${port}`;
    const p: IConnectorProxyRefreshed = {
        type: CONNECTOR_RAYOBYTE_TYPE,
        transportType: TRANSPORT_PROXY_TYPE,
        key: name,
        name: name,
        status: EProxyStatus.STARTED,
        removingForceCap: true,
        config,
        countryLike,
    };

    return p;
}


export class ConnectorRayobyteService implements IConnectorService {
    private readonly logger = new Logger(ConnectorRayobyteService.name);

    private readonly api: RayobyteApi;

    constructor(
        credentialConfig: IConnectorRayobyteCredential,
        private readonly connectorConfig: IConnectorRayobyteConfig,
        agents: Agents
    ) {
        this.api = new RayobyteApi(
            credentialConfig.email,
            credentialConfig.apiKey,
            agents
        );
    }

    async getProxies(keys: string[]): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`getProxies(): keys.length=${keys.length}`);

        const filter = (this.connectorConfig.packageFilter ?? 'all').toLowerCase();
        const proxies = await this.api.exportProxies(filter);
        const proxiesFiltered = proxies
            .map((p) => convertToProxy(
                p,
                this.connectorConfig.packageFilter
            ))
            .filter((p) => p && keys.includes(p.key));

        return proxiesFiltered as IConnectorProxyRefreshed[];

    }

    async createProxies(
        count: number, totalCount: number, excludeKeys: string[]
    ): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`createProxies(): count=${count} / totalCount=${totalCount} / excludeKeys.length=${excludeKeys.length}`);

        const filter = (this.connectorConfig.packageFilter ?? 'all').toLowerCase();
        const proxies = await this.api.exportProxies(filter);
        const proxiesFiltered = proxies
            .map((p) => convertToProxy(
                p,
                this.connectorConfig.packageFilter
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

        const ips = keys
            .filter((p) => p.force)
            .map((p) => p.key.split(':')[ 0 ]);

        if (ips.length > 0) {
            await this.api.replaceProxies(ips);
        }

        return keys.map((p) => p.key);
    }
}
