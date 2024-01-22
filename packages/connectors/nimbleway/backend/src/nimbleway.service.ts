import { Logger } from '@nestjs/common';
import {
    EProxyStatus,
    randomName,
    safeJoin,
} from '@scrapoxy/common';
import { CONNECTOR_NIMBLEWAY_TYPE } from '@scrapoxy/connector-nimbleway-sdk';
import type { IConnectorService } from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IProxyKeyToRemove,
} from '@scrapoxy/common';


function convertToProxy(key: string): IConnectorProxyRefreshed {
    const p: IConnectorProxyRefreshed = {
        type: CONNECTOR_NIMBLEWAY_TYPE,
        key: key,
        name: key,
        status: EProxyStatus.STARTED,
        config: {},
    };

    return p;
}


export class ConnectorNimblewayService implements IConnectorService {
    private readonly logger = new Logger(ConnectorNimblewayService.name);

    async getProxies(keys: string[]): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`getProxies(): keys=${safeJoin(keys)}`);

        return keys.map(convertToProxy);
    }

    async createProxies(
        count: number, excludeKeys: string[]
    ): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`createProxies(): count=${count} / excludeKeys=${safeJoin(excludeKeys)}`);

        const proxies: IConnectorProxyRefreshed[] = [];
        for (let i = 0; i < count; ++i) {
            proxies.push(convertToProxy(randomName()));
        }

        return proxies;
    }

    async startProxies(keys: string[]): Promise<void> {
        this.logger.debug(`startProxies(): keys=${safeJoin(keys)}`);

        // Not used
    }

    async removeProxies(keys: IProxyKeyToRemove[]): Promise<string[]> {
        return keys.map((k) => k.key);
    }
}
