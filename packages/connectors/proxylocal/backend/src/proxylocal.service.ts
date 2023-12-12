import { Logger } from '@nestjs/common';
import { Agents } from '@scrapoxy/backend-sdk';
import {
    EProxyStatus,
    safeJoin,
} from '@scrapoxy/common';
import { CONNECTOR_PROXYLOCAL_TYPE } from '@scrapoxy/connector-proxylocal-sdk';
import { ProxylocalApi } from './api';
import type { IConnectorProxylocalCredential } from './proxylocal.interface';
import type { IConnectorProxyRefreshedConfigProxylocal } from './transport/proxylocal.interface';
import type { IConnectorService } from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IProxyKeyToRemove,
} from '@scrapoxy/common';


function convertToProxy(
    url: string,
    session: string
): IConnectorProxyRefreshed {
    const config: IConnectorProxyRefreshedConfigProxylocal = {
        url,
    };
    const proxy: IConnectorProxyRefreshed = {
        type: CONNECTOR_PROXYLOCAL_TYPE,
        key: session,
        name: session,
        status: EProxyStatus.STARTED,
        config,
    };

    return proxy;
}


export class ConnectorProxylocalService implements IConnectorService {
    private readonly logger = new Logger(ConnectorProxylocalService.name);

    private readonly api: ProxylocalApi;

    constructor(
        private readonly url: string,
        credentialConfig: IConnectorProxylocalCredential,
        agents: Agents
    ) {
        this.api = new ProxylocalApi(
            this.url,
            credentialConfig.token,
            agents
        );
    }

    async getProxies(keys: string[]): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug('getProxies()');

        const sessions = await this.api.getAllSessions();

        return sessions
            .filter((s) => keys.includes(s))
            .map((session) => convertToProxy(
                this.url,
                session
            ));
    }

    async createProxies(count: number): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`createProxies(): count=${count}`);

        const sessions: string[] = [];
        for (let i = 0; i < count; ++i) {
            const session = await this.api.createSession();
            sessions.push(session);
        }

        return sessions.map((session) => convertToProxy(
            this.url,
            session
        ));
    }

    async startProxies(): Promise<void> {
        // Nothing
    }

    async removeProxies(keys: IProxyKeyToRemove[]): Promise<string[]> {
        const proxiesKeys = keys.map((p) => p.key);
        this.logger.debug(`removeProxies(): keys=${safeJoin(proxiesKeys)}`);

        await Promise.all(proxiesKeys.map((key) =>
            this.api.removeSession(key)));

        return [];
    }
}
