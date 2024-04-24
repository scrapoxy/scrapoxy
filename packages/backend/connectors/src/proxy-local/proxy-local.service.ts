import { Logger } from '@nestjs/common';
import { Agents } from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_PROXY_LOCAL_TYPE,
    EProxyStatus,
} from '@scrapoxy/common';
import { ProxyLocalApi } from './api';
import { TRANSPORT_PROXY_LOCAL_TYPE } from './transport/proxy-local.constants';
import type { IConnectorProxyLocalCredential } from './proxy-local.interface';
import type { IConnectorProxyRefreshedConfigProxyLocal } from './transport/proxy-local.interface';
import type { IConnectorService } from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IProxyKeyToRemove,
} from '@scrapoxy/common';


function convertToProxy(
    url: string,
    session: string
): IConnectorProxyRefreshed {
    const config: IConnectorProxyRefreshedConfigProxyLocal = {
        url,
    };
    const proxy: IConnectorProxyRefreshed = {
        type: CONNECTOR_PROXY_LOCAL_TYPE,
        transportType: TRANSPORT_PROXY_LOCAL_TYPE,
        key: session,
        name: session,
        status: EProxyStatus.STARTED,
        config,
    };

    return proxy;
}


export class ConnectorProxyLocalService implements IConnectorService {
    private readonly logger = new Logger(ConnectorProxyLocalService.name);

    private readonly api: ProxyLocalApi;

    constructor(
        private readonly url: string,
        credentialConfig: IConnectorProxyLocalCredential,
        agents: Agents
    ) {
        this.api = new ProxyLocalApi(
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
        this.logger.debug(`removeProxies(): keys.length=${keys.length}`);

        await Promise.all(keys.map((p) =>
            this.api.removeSession(p.key)));

        return [];
    }
}
