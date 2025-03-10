import { Logger } from '@nestjs/common';
import { generateRandomString } from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_PROXY_CHEAP_RESIDENTIAL_TYPE,
    EProxyStatus,
} from '@scrapoxy/common';
import { TRANSPORT_PROXY_CHEAP_RESIDENTIAL_TYPE } from './transport/pc-residential.constants';
import type { IConnectorService } from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IProxyKeyToRemove,
} from '@scrapoxy/common';


export function convertToProxy(session: string): IConnectorProxyRefreshed {
    const p: IConnectorProxyRefreshed = {
        type: CONNECTOR_PROXY_CHEAP_RESIDENTIAL_TYPE,
        transportType: TRANSPORT_PROXY_CHEAP_RESIDENTIAL_TYPE,
        key: session,
        name: session,
        status: EProxyStatus.STARTED,
        removingForceCap: false,
        config: {},
        countryLike: null, // Not used because I can't test...
    };

    return p;
}


export class ConnectorProxyCheapResidentialService implements IConnectorService {
    private readonly logger = new Logger(ConnectorProxyCheapResidentialService.name);

    async getProxies(keys: string[]): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`getProxies(): keys.length=${keys.length}`);

        const proxies = keys.map(convertToProxy);

        return proxies;
    }

    async createProxies(count: number): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`createProxies(): count=${count}`);

        const proxies: IConnectorProxyRefreshed[] = [];
        for (let i = 0; i < count; i++) {
            proxies.push(convertToProxy(generateRandomString(8)));
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
