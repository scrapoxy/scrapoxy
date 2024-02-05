import { Logger } from '@nestjs/common';
import { generateRandomString } from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_IPROYAL_RESIDENTIAL_TYPE,
    EProxyStatus,
    safeJoin,
} from '@scrapoxy/common';
import type { IConnectorService } from '@scrapoxy/backend-sdk';
import type{
    IConnectorProxyRefreshed,
    IProxyKeyToRemove,
} from '@scrapoxy/common';


function convertToProxy(session: string): IConnectorProxyRefreshed {
    const p: IConnectorProxyRefreshed = {
        type: CONNECTOR_IPROYAL_RESIDENTIAL_TYPE,
        key: session,
        name: session,
        status: EProxyStatus.STARTED,
        config: {},
    };

    return p;
}


export class ConnectorIproyalService implements IConnectorService {
    private readonly logger = new Logger(ConnectorIproyalService.name);

    async getProxies(keys: string[]): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`getProxies(): keys=${safeJoin(keys)}`);

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
