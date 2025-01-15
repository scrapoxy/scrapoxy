import { Logger } from '@nestjs/common';
import { Agents } from '@scrapoxy/backend-sdk';
import { ProxySellerResidentialApi } from './api';
import { convertToProxy } from './ps-residential.helpers';
import type {
    IConnectorProxySellerResidentialConfig,
    IConnectorProxySellerResidentialCredential,
    IProxySellerResidentList,
} from './ps-residential.interface';
import type { IConnectorService } from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IProxyKeyToRemove,
} from '@scrapoxy/common';


export class ConnectorProxySellerResidentialService implements IConnectorService {
    private readonly logger = new Logger(ConnectorProxySellerResidentialService.name);

    private readonly api: ProxySellerResidentialApi;

    constructor(
        credentialConfig: IConnectorProxySellerResidentialCredential,
        private readonly connectorConfig: IConnectorProxySellerResidentialConfig,
        agents: Agents
    ) {
        this.api = new ProxySellerResidentialApi(
            credentialConfig.token,
            agents
        );
    }

    async getProxies(keys: string[]): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`getProxies(): keys.length=${keys.length}`);

        const lists = await this.api.getAllListsByTitle(this.connectorConfig.title);

        if (lists.length <= 0) {
            return [];
        }

        const proxies: IConnectorProxyRefreshed[] = [];
        for (const list of lists) {
            for (let i = 0; i < list.export.ports; ++i) {
                proxies.push(convertToProxy(
                    list,
                    i,
                    this.connectorConfig.countryCode
                ));
            }
        }

        return proxies;
    }

    async createProxies(
        count: number, totalCount: number
    ): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`createProxies(): count=${count} / totalCount=${totalCount}`);

        await this.removeAllLists();

        const list = await this.api.createList({
            title: this.connectorConfig.title,
            whitelist: '',
            geo: {
                country: this.connectorConfig.countryCode === 'all' ? '' : this.connectorConfig.countryCode.toUpperCase(),
                region: this.connectorConfig.region === 'all' ? '' : this.connectorConfig.region,
                city: this.connectorConfig.city === 'all' ? '' : this.connectorConfig.city,
                isp: this.connectorConfig.isp === 'all' ? '' : this.connectorConfig.isp,
            },
            export: {
                ports: totalCount,
                ext: 'txt',
            },
        });
        const proxies: IConnectorProxyRefreshed[] = [];
        for (let i = 0; i < list.export.ports; ++i) {
            proxies.push(convertToProxy(
                list,
                i,
                this.connectorConfig.countryCode
            ));
        }

        return proxies;
    }

    async startProxies(): Promise<void> {
        // Not used
    }

    async removeProxies(
        keys: IProxyKeyToRemove[], totalCount: number
    ): Promise<string[]> {
        this.logger.debug(`removeProxies(): keys.length=${keys.length} / totalCount=${totalCount}`);

        const lists = await this.removeAllLists();
        const keysToRemove: string[] = [];
        for (const list of lists) {
            for (let i = 0; i < list.export.ports; ++i) {
                keysToRemove.push(`${list.login}${i}`);
            }
        }

        return keysToRemove;
    }

    private async removeAllLists(): Promise<IProxySellerResidentList[]> {
        const lists = await this.api.getAllListsByTitle(this.connectorConfig.title);
        const promises = lists.map((list) => this.api.removeListById(list.id));
        await Promise.all(promises);

        return lists;
    }
}
