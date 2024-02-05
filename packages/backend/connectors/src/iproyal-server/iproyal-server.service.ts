import { Logger } from '@nestjs/common';
import { Agents } from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_IPROYAL_SERVER_TYPE,
    EProxyStatus,
    EProxyType,
    safeJoin,
} from '@scrapoxy/common';
import { IproyalServerApi } from './api';
import type {
    IConnectorIproyalServerConfig,
    IConnectorIproyalServerCredential,
    IIproyalServerProxy,
} from './iproyal-server.interface';
import type { IConnectorService } from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IProxyKeyToRemove,
    IProxyTransport,
} from '@scrapoxy/common';


function convertToProxy(session: IIproyalServerProxy): IConnectorProxyRefreshed | undefined {
    if (!session) {
        return;
    }

    const arr = session.credentials.split(':');

    if (arr.length !== 4) {
        return;
    }

    const [
        hostname,
        portRaw,
        username,
        password,
    ] = arr;
    let port: number;
    try {
        port = parseInt(
            portRaw,
            10
        );
    } catch (err: any) {
        return;
    }

    const config: IProxyTransport = {
        type: EProxyType.HTTP,
        address: {
            hostname,
            port,
        },
        auth: {
            username,
            password,
        },
    };
    const key = session.id.toString();
    const p: IConnectorProxyRefreshed = {
        type: CONNECTOR_IPROYAL_SERVER_TYPE,
        key,
        name: key,
        status: EProxyStatus.STARTED,
        config,
    };

    return p;
}


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
        this.logger.debug(`getProxies(): keys=${safeJoin(keys)}`);

        const proxies = await this.api.getAllProxies(
            this.connectorConfig.product,
            this.connectorConfig.country
        );
        const proxiesFiltered = proxies
            .map(convertToProxy)
            .filter((p) => p && keys.includes(p.key));

        return proxiesFiltered as IConnectorProxyRefreshed[];
    }

    async createProxies(
        count: number, excludeKeys: string[]
    ): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`createProxies(): count=${count} / excludeKeys=${safeJoin(excludeKeys)}`);

        const proxies = await this.api.getAllProxies(
            this.connectorConfig.product,
            this.connectorConfig.country
        );
        const proxiesFiltered = proxies
            .map(convertToProxy)
            .filter((p) => p && !excludeKeys.includes(p.key))
            .slice(
                0,
                count
            );

        return proxiesFiltered as IConnectorProxyRefreshed[];
    }

    async startProxies(keys: string[]): Promise<void> {
        this.logger.debug(`startProxies(): keys=${safeJoin(keys)}`);

        // Not used
    }

    async removeProxies(keys: IProxyKeyToRemove[]): Promise<string[]> {
        const proxiesKeys = keys.map((p) => p.key);
        this.logger.debug(`removeProxies(): keys=${safeJoin(proxiesKeys)}`);

        return proxiesKeys;
    }
}
