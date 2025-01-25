import { Logger } from '@nestjs/common';
import {
    generateRandomString,
    TRANSPORT_PROXY_TYPE,
} from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_EVOMI_TYPE,
    EProxyStatus,
    EProxyType,
} from '@scrapoxy/common';
import type { IConnectorEvomiConfig } from './evomi.interface';
import type { IConnectorService } from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IProxyKeyToRemove,
    IProxyTransport,
} from '@scrapoxy/common';


function formatPassword(
    password: string,
    session: string,
    country: string
): string {
    const lines = [
        password, `session-${session}`,
    ];

    if (country !== 'all') {
        lines.push(`country-${country.toUpperCase()}`);
    }

    return lines.join('_');
}


function convertToProxy(
    hostname: string,
    port: number,
    username: string,
    password: string,
    session: string,
    country: string
): IConnectorProxyRefreshed {
    const config: IProxyTransport = {
        type: EProxyType.HTTP,
        address: {
            hostname,
            port,
        },
        auth: {
            username,
            password: formatPassword(
                password,
                session,
                country
            ),
        },
    };
    const p: IConnectorProxyRefreshed = {
        type: CONNECTOR_EVOMI_TYPE,
        transportType: TRANSPORT_PROXY_TYPE,
        key: session,
        name: session,
        status: EProxyStatus.STARTED,
        removingForceCap: false,
        config,
        countryLike: country !== 'all' ? country : null,
    };

    return p;
}


export class ConnectorEvomiResidentialService implements IConnectorService {
    private readonly logger = new Logger(ConnectorEvomiResidentialService.name);

    constructor(private readonly connectorConfig: IConnectorEvomiConfig) {}

    async getProxies(keys: string[]): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`getProxies(): keys.length=${keys.length}`);

        const proxies = keys.map((key) => convertToProxy(
            this.connectorConfig.hostname as string,
            this.connectorConfig.port,
            this.connectorConfig.username as string,
            this.connectorConfig.password as string,
            key,
            this.connectorConfig.country
        ));

        return proxies;
    }

    async createProxies(count: number): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`createProxies(): count=${count}`);

        const proxies: IConnectorProxyRefreshed[] = [];
        for (let i = 0; i < count; i++) {
            proxies.push(convertToProxy(
                this.connectorConfig.hostname as string,
                this.connectorConfig.port,
                this.connectorConfig.username as string,
                this.connectorConfig.password as string,
                generateRandomString(8),
                this.connectorConfig.country
            ));
        }

        return proxies;
    }

    async startProxies(): Promise<void> {
        // Not used
    }

    async removeProxies(keys: IProxyKeyToRemove[]): Promise<string[]> {
        this.logger.debug(`removeProxies(): keys.length=${keys.length}`);

        return keys.map((p) => p.key);
    }
}
