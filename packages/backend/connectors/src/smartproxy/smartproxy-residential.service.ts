import { Logger } from '@nestjs/common';
import {
    CONNECTOR_SMARTPROXY_TYPE,
    EProxyStatus,
} from '@scrapoxy/common';
import { TRANSPORT_SMARTPROXY_RESIDENTIAL_TYPE } from './transport';
import type {
    IConnectorSmartproxyConfig,
    IConnectorSmartproxyCredential,
    ISmartproxyEndpoint,
} from './smartproxy.interface';
import type {
    IConnectorService,
    IProxyToConnectConfigResidential,
} from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IProxyKeyToRemove,
} from '@scrapoxy/common';


export class ConnectorSmartproxyResidentialService implements IConnectorService {
    private readonly logger = new Logger(ConnectorSmartproxyResidentialService.name);

    constructor(
        private readonly credentialConfig: IConnectorSmartproxyCredential,
        private readonly connectorConfig: IConnectorSmartproxyConfig,
        private readonly endpoints: Map<string, ISmartproxyEndpoint>
    ) {}

    async getProxies(keys: string[]): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`getProxies(): keys.length=${keys.length}`);

        const endpoint = this.getEndpoint();
        const proxies = keys.map((key) => {
            const config: IProxyToConnectConfigResidential = {
                address: {
                    hostname: endpoint.hostname,
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
                transportType: TRANSPORT_SMARTPROXY_RESIDENTIAL_TYPE,
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

        const endpoint = this.getEndpoint();
        const excludeKeysSet = new Set(excludeKeys);
        let port = endpoint.portMin;
        const newProxies: IConnectorProxyRefreshed[] = [];
        while (newProxies.length < count && port <= endpoint.portMax) {
            const key = port.toString(10);

            if (!excludeKeysSet.has(key)) {
                const config: IProxyToConnectConfigResidential = {
                    address: {
                        hostname: endpoint.hostname,
                        port,
                    },
                    username: this.credentialConfig.username,
                    password: this.credentialConfig.password,
                };
                newProxies.push({
                    key,
                    name: key,
                    type: CONNECTOR_SMARTPROXY_TYPE,
                    transportType: TRANSPORT_SMARTPROXY_RESIDENTIAL_TYPE,
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

    private getEndpoint(): ISmartproxyEndpoint {
        if (this.connectorConfig.country === 'all') {
            return {
                code: 'all',
                hostname: 'gate.smartproxy.com',
                portMin: 10001,
                portMax: 49999,
            };
        }

        const endpointFound = this.endpoints.get(this.connectorConfig.country);

        if (endpointFound) {
            return endpointFound;
        }

        throw new Error(`Endpoint not found for country ${this.connectorConfig.country}`);
    }
}
