import { Logger } from '@nestjs/common';
import {
    CONNECTOR_PROXYRACK_TYPE,
    EProxyStatus,
    randomName,
    safeJoin,
} from '@scrapoxy/common';
import { ProxyrackApi } from './api';
import { Agents } from '../../helpers';
import type {
    IConnectorProxyrackConfig,
    IConnectorProxyrackCredential,
    IProxyrackSession,
} from './proxyrack.interface';
import type { IConnectorService } from '../providers.interface';
import type {
    IConnectorProxyRefreshed,
    IProxyKeyToRemove,
} from '@scrapoxy/common';


function convertSessionToProxy(session: IProxyrackSession): IConnectorProxyRefreshed {
    const p: IConnectorProxyRefreshed = {
        type: CONNECTOR_PROXYRACK_TYPE,
        key: session.session,
        name: session.session,
        status: session.proxy.online ? EProxyStatus.STARTED : EProxyStatus.STARTING,
        config: {},
    };

    return p;
}


function convertNameToProxy(name: string): IConnectorProxyRefreshed {
    const p: IConnectorProxyRefreshed = {
        type: CONNECTOR_PROXYRACK_TYPE,
        key: name,
        name,
        status: EProxyStatus.STARTING,
        config: {},
    };

    return p;
}


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
        this.logger.debug(`getProxies(): keys=${safeJoin(keys)}`);

        const sessions = await this.api.listAllSessions();
        const proxies = sessions
            .map(convertSessionToProxy)
            .filter((p) => p && keys.includes(p.key));

        return proxies;
    }

    async createProxies(
        count: number, excludeKeys: string[]
    ): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`createProxies(): count=${count} / excludeKeys=${safeJoin(excludeKeys)}`);

        // List all sessions
        const sessions = await this.api.listAllSessions();
        const proxiesFiltered = sessions
            .map(convertSessionToProxy)
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

                    proxiesFiltered.push(convertNameToProxy(name));
                })();

                promises.push(promise);
            }

            await Promise.all(promises);
        }

        return proxiesFiltered as IConnectorProxyRefreshed[];
    }

    async startProxies(keys: string[]): Promise<void> {
        this.logger.debug(`startProxies(): keys=${safeJoin(keys)}`);

        // Not used
    }

    async removeProxies(keys: IProxyKeyToRemove[]): Promise<string[]> {
        const proxiesKeys = keys.map((p) => p.key);
        this.logger.debug(`removeProxies(): keys=${safeJoin(proxiesKeys)}`);

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

        return proxiesKeys;
    }
}
