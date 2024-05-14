import { Logger } from '@nestjs/common';
import {
    CONNECTOR_NETNUT_TYPE,
    EProxyStatus,
} from '@scrapoxy/common';
import { TRANSPORT_NETNUT_TYPE } from './transport/netnut.constants';
import type { IConnectorNetnutConfig } from './netnut.interface';
import type { IConnectorService } from '@scrapoxy/backend-sdk';
import type{
    IConnectorProxyRefreshed,
    IProxyKeyToRemove,
} from '@scrapoxy/common';


function convertToProxy(session: string): IConnectorProxyRefreshed {
    const p: IConnectorProxyRefreshed = {
        type: CONNECTOR_NETNUT_TYPE,
        transportType: TRANSPORT_NETNUT_TYPE,
        key: session,
        name: session,
        status: EProxyStatus.STARTED,
        config: {},
    };

    return p;
}


export class ConnectorNetnutService implements IConnectorService {
    private readonly logger = new Logger(ConnectorNetnutService.name);

    constructor(private readonly config: IConnectorNetnutConfig) {}

    async getProxies(keys: string[]): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`getProxies(): keys.length=${keys.length}`);

        const proxies = keys.map(convertToProxy);

        return proxies;
    }

    async createProxies(count: number): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`createProxies(): count=${count}`);

        const proxies: IConnectorProxyRefreshed[] = [];
        const proxyType = this.config.proxyType.toUpperCase();
        for (let i = 0; i < count; i++) {
            const id = Math.floor(Math.random() * 99999999) + 1;
            proxies.push(convertToProxy(`${proxyType}${id}`));
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
