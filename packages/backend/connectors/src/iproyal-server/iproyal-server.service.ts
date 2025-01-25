import { Logger } from '@nestjs/common';
import { Agents } from '@scrapoxy/backend-sdk';
import { pickRandom } from '@scrapoxy/common';
import { IproyalServerApi } from './api';
import { convertToProxy } from './iproyal-server.helpers';
import type {
    IConnectorIproyalServerConfig,
    IConnectorIproyalServerCredential,
} from './iproyal-server.interface';
import type { IConnectorService } from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IProxyKeyToRemove,
} from '@scrapoxy/common';


export class ConnectorIproyalService implements IConnectorService {
    private readonly logger = new Logger(ConnectorIproyalService.name);

    private readonly api: IproyalServerApi;

    constructor(
        credentialConfig: IConnectorIproyalServerCredential,
        private readonly connectorConfig: IConnectorIproyalServerConfig,
        agents: Agents
    ) {
        this.api = new IproyalServerApi(
            credentialConfig.token,
            agents
        );
    }

    async getProxies(keys: string[]): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`getProxies(): keys.length=${keys.length}`);

        const proxies = await this.api.getAllProxies(
            this.connectorConfig.product,
            this.connectorConfig.country
        );
        const proxiesFiltered = proxies
            .map((p) => convertToProxy(
                p,
                this.connectorConfig.country
            ))
            .filter((p) => p && keys.includes(p.key));

        return proxiesFiltered as IConnectorProxyRefreshed[];
    }

    async createProxies(
        count: number, totalCount: number, excludeKeys: string[]
    ): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`createProxies(): count=${count} / totalCount=${totalCount} / excludeKeys.length=${excludeKeys.length}`);

        const proxies = await this.api.getAllProxies(
            this.connectorConfig.product,
            this.connectorConfig.country
        );
        const proxiesFiltered = proxies
            .map((p) => convertToProxy(
                p,
                this.connectorConfig.country
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

        return keys.map((p) => p.key);
    }
}
