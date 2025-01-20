import { Logger } from '@nestjs/common';
import { generateRandomString } from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_IPROYAL_RESIDENTIAL_TYPE,
    EProxyStatus,
} from '@scrapoxy/common';
import { TRANSPORT_IPROYAL_RESIDENTIAL_TYPE } from './transport/iproyal-residential.constants';
import type { IConnectorIproyalResidentialConfig } from './iproyal-residential.interface';
import type { IConnectorService } from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IProxyKeyToRemove,
} from '@scrapoxy/common';


export function convertToProxy(
    session: string,
    country: string
): IConnectorProxyRefreshed {
    const p: IConnectorProxyRefreshed = {
        type: CONNECTOR_IPROYAL_RESIDENTIAL_TYPE,
        transportType: TRANSPORT_IPROYAL_RESIDENTIAL_TYPE,
        key: session,
        name: session,
        status: EProxyStatus.STARTED,
        removingForceCap: false,
        config: {},
        countryLike: country !== 'all' ? country : null,
    };

    return p;
}


export class ConnectorIproyalService implements IConnectorService {
    private readonly logger = new Logger(ConnectorIproyalService.name);

    constructor(private readonly connectorConfig: IConnectorIproyalResidentialConfig) {}

    async getProxies(keys: string[]): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`getProxies(): keys.length=${keys.length}`);

        const proxies = keys.map((key) => convertToProxy(
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
