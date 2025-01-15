import { Logger } from '@nestjs/common';
import { Agents } from '@scrapoxy/backend-sdk';
import { ProxyCheapServerApi } from './api';
import { convertToProxy } from './pc-server.helpers';
import type {
    IConnectorProxyCheapServerConfig,
    IConnectorProxyCheapServerCredential,
} from './pc-server.interface';
import type { IConnectorService } from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IProxyKeyToRemove,
} from '@scrapoxy/common';


export class ConnectorProxyCheapServerService implements IConnectorService {
    private readonly logger = new Logger(ConnectorProxyCheapServerService.name);

    private readonly api: ProxyCheapServerApi;

    constructor(
        credentialConfig: IConnectorProxyCheapServerCredential,
        private readonly connectorConfig: IConnectorProxyCheapServerConfig,
        agents: Agents
    ) {
        this.api = new ProxyCheapServerApi(
            credentialConfig.key,
            credentialConfig.secret,
            agents
        );
    }

    async getProxies(keys: string[]): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`getProxies(): keys.length=${keys.length}`);

        const proxies = await this.api.getAllProxies(this.connectorConfig.networkType);
        const proxiesFiltered = proxies
            .map(convertToProxy)
            .filter((p) => p && keys.includes(p.key));

        return proxiesFiltered as IConnectorProxyRefreshed[];
    }

    async createProxies(
        count: number, totalCount: number, excludeKeys: string[]
    ): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`createProxies(): count=${count} / totalCount=${totalCount} / excludeKeys.length=${excludeKeys.length}`);

        const proxies = await this.api.getAllProxies(this.connectorConfig.networkType);
        const proxiesFiltered = proxies
            .map(convertToProxy)
            .filter((p) => p && !excludeKeys.includes(p.key))
            .slice(
                0,
                count
            );

        return proxiesFiltered as IConnectorProxyRefreshed[];
    }

    async startProxies(): Promise<void> {
        // Not used
    }

    async removeProxies(keys: IProxyKeyToRemove[]): Promise<string[]> {
        this.logger.debug(`removeProxies(): keys.length=${keys.length}`);

        return keys.map((p) => p.key);
    }
}
