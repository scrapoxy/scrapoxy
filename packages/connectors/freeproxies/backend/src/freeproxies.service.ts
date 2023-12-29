import { Logger } from '@nestjs/common';
import { CommanderRefreshClientService } from '@scrapoxy/backend-sdk';
import {
    EProxyStatus,
    safeJoin,
} from '@scrapoxy/common';
import { CONNECTOR_FREEPROXIES_TYPE } from '@scrapoxy/connector-freeproxies-sdk';
import type { IConnectorService } from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IConnectorToRefresh,
    IFreeproxy,
    IProxyKeyToRemove,
    IProxyTransport,
} from '@scrapoxy/common';


function convertToProxy(f: IFreeproxy): IConnectorProxyRefreshed {
    const config: IProxyTransport = {
        type: f.type,
        address: f.address,
        auth: f.auth,
    };
    const p: IConnectorProxyRefreshed = {
        type: CONNECTOR_FREEPROXIES_TYPE,
        key: f.key,
        name: f.key,
        status: !!f.fingerprint ? EProxyStatus.STARTED : EProxyStatus.STARTING,
        config,
    };

    return p;
}


export class ConnectorFreeproxiesService implements IConnectorService {
    private readonly logger = new Logger(ConnectorFreeproxiesService.name);

    constructor(
        private readonly connector: IConnectorToRefresh,
        private readonly commander: CommanderRefreshClientService
    ) {}

    async getProxies(keys: string[]): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`getProxies(): keys=${safeJoin(keys)}`);

        if (keys.length <= 0) {
            return [];
        }

        const freeproxies = await this.commander.getSelectedProjectFreeproxies(
            this.connector.projectId,
            this.connector.id,
            keys
        );

        return freeproxies.map(convertToProxy);
    }

    async createProxies(
        count: number, excludeKeys: string[]
    ): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`createProxies(): count=${count} / excludeKeys=${safeJoin(excludeKeys)}`);

        const freeproxies = await this.commander.getNewProjectFreeproxies(
            this.connector.projectId,
            this.connector.id,
            count,
            excludeKeys
        );

        return freeproxies.map(convertToProxy);
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
