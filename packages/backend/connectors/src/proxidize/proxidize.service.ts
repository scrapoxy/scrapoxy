import { Logger } from '@nestjs/common';
import { Agents } from '@scrapoxy/backend-sdk';
import { pickRandom } from '@scrapoxy/common';
import { ProxidizeApi } from './api';
import { convertToProxy } from './proxidize.helpers';
import type { IConnectorProxidizeCredential } from './proxidize.interface';
import type { IConnectorService } from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IProxyKeyToRemove,
} from '@scrapoxy/common';


export class ConnectorProxidizeService implements IConnectorService {
    private readonly logger = new Logger(ConnectorProxidizeService.name);

    private readonly api: ProxidizeApi;

    constructor(
        private readonly credentialConfig: IConnectorProxidizeCredential,
        agents: Agents
    ) {
        this.api = new ProxidizeApi(
            this.credentialConfig.apiUrl,
            this.credentialConfig.apiToken,
            agents
        );
    }

    async getProxies(keys: string[]): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`getProxies(): keys.length=${keys.length}`);

        const devices = await this.api.getDevices();
        const proxies = devices
            .filter((d) => keys.includes(d.Index.toString(10)))
            .map((d) => convertToProxy(
                d,
                this.credentialConfig.proxyHostname
            ));

        return proxies;
    }

    async createProxies(
        count: number, totalCount: number, excludeKeys: string[]
    ): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`createProxies(): count=${count} / totalCount=${totalCount} / excludeKeys.length=${excludeKeys.length}`);

        const devices = await this.api.getDevices();
        const proxiesFiltered = devices
            .filter((d) => !excludeKeys.includes(d.Index.toString(10)))

            .map((d) => convertToProxy(
                d,
                this.credentialConfig.proxyHostname
            ));
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

        const promises = keys
            .map((proxy) => {
                const index = parseInt(
                    proxy.key,
                    10
                );

                if (proxy.force) {
                    return this.api.rebootDevice(index);
                } else {
                    return this.api.rotateDevice(index);
                }
            });

        await Promise.all(promises);

        return keys.map((p) => p.key);
    }
}
