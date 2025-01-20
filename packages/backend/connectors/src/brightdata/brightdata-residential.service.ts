import { Logger } from '@nestjs/common';
import { randomName } from '@scrapoxy/common';
import {
    convertToProxy,
    getBrightdataPrefix,
} from './brightdata.helpers';
import { TRANSPORT_BRIGHTDATA_RESIDENTIAL_TYPE } from './transport';
import type { IConnectorBrightdataConfig } from './brightdata.interface';
import type { IConnectorService } from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IProxyKeyToRemove,
} from '@scrapoxy/common';


export class ConnectorBrightdataResidentialService implements IConnectorService {
    private readonly logger = new Logger(ConnectorBrightdataResidentialService.name);

    constructor(private readonly connectorConfig: IConnectorBrightdataConfig) {}

    async getProxies(keys: string[]): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`getProxies(): keys.length=${keys.length}`);

        return this.convertProxiesFromKeys(keys);
    }

    async createProxies(
        count: number, totalCount: number, excludeKeys: string[]
    ): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`createProxies(): count=${count} / totalCount=${totalCount} / excludeKeys.length=${excludeKeys.length}`);

        const prefix = getBrightdataPrefix(this.connectorConfig.productType);
        const keys: string[] = [];
        for (let i = 0; i < count; ++i) {
            keys.push(randomName(prefix));
        }

        return this.convertProxiesFromKeys(keys);
    }

    async startProxies(): Promise<void> {
        // Not used
    }

    async removeProxies(keys: IProxyKeyToRemove[]): Promise<string[]> {
        this.logger.debug(`removeProxies(): keys.length=${keys.length}`);

        return keys.map((k) => k.key);
    }

    private async convertProxiesFromKeys(keys: string[]): Promise<IConnectorProxyRefreshed[]> {
        const proxies = keys.map((key) => convertToProxy(
            key,
            TRANSPORT_BRIGHTDATA_RESIDENTIAL_TYPE,
            false,
            this.connectorConfig.username,
            this.connectorConfig.password,
            this.connectorConfig.country
        ));

        return proxies;
    }
}
