import { Logger } from '@nestjs/common';
import { Agents } from '@scrapoxy/backend-sdk';
import { randomName } from '@scrapoxy/common';
import { ProxyrackApi } from './api';
import {
    convertNameToProxy,
    convertSessionToProxy,
} from './proxyrack.helpers';
import type {
    IConnectorProxyrackConfig,
    IConnectorProxyrackCredential,
} from './proxyrack.interface';
import type { IConnectorService } from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IProxyKeyToRemove,
} from '@scrapoxy/common';


export class ConnectorProxyrackService implements IConnectorService {
    private readonly logger = new Logger(ConnectorProxyrackService.name);

    private readonly api: ProxyrackApi;

    constructor(
        credentialConfig: IConnectorProxyrackCredential,
        private readonly connectorConfig: IConnectorProxyrackConfig, agents: Agents
    ) {
        this.api = new ProxyrackApi(
            credentialConfig.product,
            credentialConfig.username,
            credentialConfig.password,
            agents
        );
    }

    async getProxies(keys: string[]): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`getProxies(): keys.length=${keys.length}`);

        const sessions = await this.api.listAllSessions();
        const proxies = sessions
            .map((s) => convertSessionToProxy(
                s,
                this.connectorConfig.country
            ))
            .filter((p) => p && keys.includes(p.key));

        return proxies;
    }

    async createProxies(
        count: number, totalCount: number, excludeKeys: string[]
    ): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`createProxies(): count=${count} / totalCount=${totalCount} / excludeKeys.length=${excludeKeys.length}`);

        // List all sessions
        const sessions = await this.api.listAllSessions();
        const proxiesFiltered = sessions
            .map((s) => convertSessionToProxy(
                s,
                this.connectorConfig.country
            ))
            .filter((p) => p && !excludeKeys.includes(p.key))
            .slice(
                0,
                count
            );
        // Create missing sessions
        const diff = count - proxiesFiltered.length;

        if (diff > 0) {
            const promises: Promise<void>[] = [];
            for (let i = 0; i < diff; ++i) {
                const promise = (async() => {
                    const name = randomName();

                    await this.api.createSession({
                        session: name,
                        country: this.connectorConfig.country,
                        city: this.connectorConfig.city,
                        isp: this.connectorConfig.isp,
                        osName: this.connectorConfig.osName,
                    });

                    proxiesFiltered.push(convertNameToProxy(
                        name,
                        this.connectorConfig.country
                    ));
                })();

                promises.push(promise);
            }

            await Promise.all(promises);
        }

        return proxiesFiltered as IConnectorProxyRefreshed[];
    }

    async startProxies(): Promise<void> {
        // Not used
    }

    async removeProxies(keys: IProxyKeyToRemove[]): Promise<string[]> {
        this.logger.debug(`removeProxies(): keys.length=${keys.length}`);

        const sessionsToRelease = keys
            .filter((p) => p.force)
            .map((p) => p.key);

        if (sessionsToRelease.length > 0) {
            await Promise.all(sessionsToRelease.map((session) => this.api.deleteSession({
                session,
                country: this.connectorConfig.country,
                city: this.connectorConfig.city,
                isp: this.connectorConfig.isp,
                osName: this.connectorConfig.osName,
            })));
        }

        return keys.map((p) => p.key);
    }
}
