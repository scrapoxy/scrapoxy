import { Logger } from '@nestjs/common';
import {
    CONNECTOR_SMARTPROXY_TYPE,
    EProxyStatus,
} from '@scrapoxy/common';
import { TRANSPORT_SMARTPROXY_SERVER_TYPE } from './transport';
import type { IConnectorSmartproxyCredential } from './smartproxy.interface';
import type {
    IConnectorService,
    IProxyToConnectConfigResidential,
} from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IProxyKeyToRemove,
} from '@scrapoxy/common';


export class ConnectorSmartproxyServerService implements IConnectorService {
    private readonly logger = new Logger(ConnectorSmartproxyServerService.name);

    constructor(
        private readonly credentialConfig: IConnectorSmartproxyCredential,
        private readonly hostname: string
    ) {}

    async getProxies(keys: string[]): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`getProxies(): keys.length=${keys.length}`);

        const proxies = keys.map((key) => {
            const config: IProxyToConnectConfigResidential = {
                address: {
                    hostname: this.hostname,
                    port: parseInt(
                        key,
                        10
                    ),
                },
                username: this.credentialConfig.username,
                password: this.credentialConfig.password,
            };

            return {
                key,
                name: key,
                type: CONNECTOR_SMARTPROXY_TYPE,
                transportType: TRANSPORT_SMARTPROXY_SERVER_TYPE,
                status: EProxyStatus.STARTED,
                config,
            };
        });

        return proxies;
    }

    async createProxies(
        count: number, totalCount: number, excludeKeys: string[]
    ): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`createProxies(): count=${count} / totalCount=${totalCount} / excludeKeys.length=${excludeKeys.length}`);

        const excludeKeysSet = new Set(excludeKeys);
        let port = 10001;
        const newProxies: IConnectorProxyRefreshed[] = [];
        while (newProxies.length < count && port <= 49999) {
            const key = port.toString(10);

            if (!excludeKeysSet.has(key)) {
                const config: IProxyToConnectConfigResidential = {
                    address: {
                        hostname: this.hostname,
                        port,
                    },
                    username: this.credentialConfig.username,
                    password: this.credentialConfig.password,
                };
                newProxies.push({
                    key,
                    name: key,
                    type: CONNECTOR_SMARTPROXY_TYPE,
                    transportType: TRANSPORT_SMARTPROXY_SERVER_TYPE,
                    status: EProxyStatus.STARTED,
                    config,
                });

                excludeKeysSet.add(key);
            }

            port++;
        }

        return newProxies;
    }

    async startProxies(): Promise<void> {
        // Not used
    }

    async removeProxies(keys: IProxyKeyToRemove[]): Promise<string[]> {
        this.logger.debug(`removeProxies(): keys.length=${keys.length}`);

        return keys.map((k) => k.key);
    }
}
