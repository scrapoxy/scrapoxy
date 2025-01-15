import { Logger } from '@nestjs/common';
import { randomName } from '@scrapoxy/common';
import { convertToProxy } from './nimbleway.helpers';
import type { IConnectorNimblewayConfig } from './nimbleway.interface';
import type { IConnectorService } from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IProxyKeyToRemove,
} from '@scrapoxy/common';


export class ConnectorNimblewayService implements IConnectorService {
    private readonly logger = new Logger(ConnectorNimblewayService.name);

    constructor(private readonly connectorConfig: IConnectorNimblewayConfig) {}

    async getProxies(keys: string[]): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`getProxies(): keys.length=${keys.length}`);

        return keys.map((key) => convertToProxy(
            key,
            this.connectorConfig.country
        ));
    }

    async createProxies(count: number): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`createProxies(): count=${count}`);

        const proxies: IConnectorProxyRefreshed[] = [];
        for (let i = 0; i < count; ++i) {
            proxies.push(convertToProxy(
                randomName(),
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

        return keys.map((k) => k.key);
    }
}
