import { Logger } from '@nestjs/common';
import { generateRandomString } from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_MASSIVE_TYPE,
    EProxyStatus,
} from '@scrapoxy/common';
import { TRANSPORT_MASSIVE_RESIDENTIAL_TYPE } from './transport/massive.constants';
import type { IConnectorMassiveConfig } from './massive.interface';
import type { IConnectorService } from '@scrapoxy/backend-sdk';
import type{
    IConnectorProxyRefreshed,
    IProxyKeyToRemove,
} from '@scrapoxy/common';


function convertToProxy(
    session: string,
    country: string
): IConnectorProxyRefreshed {
    const p: IConnectorProxyRefreshed = {
        type: CONNECTOR_MASSIVE_TYPE,
        transportType: TRANSPORT_MASSIVE_RESIDENTIAL_TYPE,
        key: session,
        name: session,
        status: EProxyStatus.STARTED,
        config: {},
        countryLike: country !== 'all' ? country : null,
    };

    return p;
}


export class ConnectorMassiveService implements IConnectorService {
    private readonly logger = new Logger(ConnectorMassiveService.name);

    constructor(private readonly connectorConfig: IConnectorMassiveConfig) {}

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
