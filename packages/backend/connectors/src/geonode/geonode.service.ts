import { Logger } from '@nestjs/common';
import {
    Agents,
    TRANSPORT_PROXY_TYPE,
} from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_GEONODE_TYPE,
    EGeonodeProductType,
    EProxyStatus,
    EProxyType,
} from '@scrapoxy/common';
import { GeonodeApi } from './api';
import type {
    IConnectorGeonodeConfig,
    IConnectorGeonodeCredential,
} from './geonode.interface';
import type { IConnectorService } from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IProxyKeyToRemove,
    IProxyTransport,
} from '@scrapoxy/common';


const
    PORT_MAX = 10900,
    PORT_MIN = 10000;


export class ConnectorGeonodeService implements IConnectorService {
    private readonly logger = new Logger(ConnectorGeonodeService.name);

    private readonly api: GeonodeApi;

    constructor(
        private readonly credentialConfig: IConnectorGeonodeCredential,
        private readonly connectorConfig: IConnectorGeonodeConfig,
        agents: Agents
    ) {
        this.api = new GeonodeApi(
            credentialConfig.username,
            credentialConfig.password,
            agents
        );
    }

    async getProxies(keys: string[]): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`getProxies(): keys.length=${keys.length}`);

        const ports = keys.map((key) => parseInt(
            key.slice(3),
            10
        ));
        const proxies = ports.map((port) => this.convertToProxy(port));

        return proxies;
    }

    async createProxies(
        count: number, totalCount: number, excludeKeys: string[]
    ): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`createProxies(): count=${count} / totalCount=${totalCount} / excludeKeys.length=${excludeKeys.length}`);

        const usedPorts = new Set(excludeKeys.map((key) => parseInt(
            key.slice(3),
            10
        )));
        let port = PORT_MIN;
        const newProxies: IConnectorProxyRefreshed[] = [];
        while (newProxies.length < count && port <= PORT_MAX) {
            if (usedPorts.has(port)) {
                port++;
                continue;
            }

            newProxies.push(this.convertToProxy(port));

            usedPorts.add(port);
        }

        return newProxies;
    }

    async startProxies(): Promise<void> {
        // Not used
    }

    async removeProxies(keys: IProxyKeyToRemove[]): Promise<string[]> {
        this.logger.debug(`removeProxies(): keys.length=${keys.length}`);

        const ports = keys.map((k) => parseInt(
            k.key.slice(3),
            10
        ));

        await this.api.releaseSessionByPorts(
            this.connectorConfig.productType,
            ports
        );

        return keys.map((k) => k.key);
    }

    private convertToProxy(port: number) {
        let
            hostname: string,
            prefix: string;
        switch (this.connectorConfig.productType) {
            case EGeonodeProductType.RESIDENTIAL_PREMIUM: {
                prefix = 'RSP';
                hostname = 'premium-residential.geonode.com';
                break;
            }

            case EGeonodeProductType.SHARED_DATACENTER: {
                prefix = 'SDC';
                hostname = 'shared-datacenter.geonode.com';
                break;
            }

            default: {
                throw new Error('Unknown Geonode product type');
            }
        }

        const usernameArr = [
            this.credentialConfig.username,
        ];

        if (this.connectorConfig.country !== 'all') {
            usernameArr.push(
                'country',
                this.connectorConfig.country.toLowerCase()
            );
        }

        if (this.connectorConfig.lifetime > 0) {
            usernameArr.push(
                'lifetime',
                this.connectorConfig.lifetime.toString(10)
            );
        }

        const config: IProxyTransport = {
            type: EProxyType.HTTP,
            address: {
                hostname,
                port,
            },
            auth: {
                username: usernameArr.join('-'),
                password: this.credentialConfig.password,
            },
        };
        const key = `${prefix}${port.toString(10)}`;
        const p: IConnectorProxyRefreshed = {
            type: CONNECTOR_GEONODE_TYPE,
            transportType: TRANSPORT_PROXY_TYPE,
            name: key,
            key,
            config,
            status: EProxyStatus.STARTED,
        };

        return p;
    }
}
