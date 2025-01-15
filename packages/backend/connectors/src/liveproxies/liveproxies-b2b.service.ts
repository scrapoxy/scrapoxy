import { Logger } from '@nestjs/common';
import {
    Agents,
    TRANSPORT_PROXY_TYPE,
} from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_LIVEPROXIES_TYPE,
    EProxyStatus,
    EProxyType,
} from '@scrapoxy/common';
import { LiveproxiesApi } from './api';
import type {
    IConnectorLiveproxiesConfig,
    IConnectorLiveproxiesCredential,
    ILiveproxiesPlanB2B,
} from './liveproxies.interface';
import type { IConnectorService } from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IProxyKeyToRemove,
    IProxyTransport,
} from '@scrapoxy/common';


const
    DEFAULT_HOSTNAME = 'b2b.liveproxies.io',
    DEFAULT_PORT = 7383;


function convertToProxy(
    key: string,
    country: string,
    plan: ILiveproxiesPlanB2B
): IConnectorProxyRefreshed {
    const config: IProxyTransport = {
        type: EProxyType.HTTP,
        address: {
            hostname: DEFAULT_HOSTNAME,
            port: DEFAULT_PORT,
        },
        auth: {
            username: `${plan.username}-lv_${country}-${key}`,
            password: plan.password,
        },
    };

    return {
        type: CONNECTOR_LIVEPROXIES_TYPE,
        key,
        name: key,
        transportType: TRANSPORT_PROXY_TYPE,
        config,
        status: EProxyStatus.STARTED,
        countryLike: country !== 'all' ? country : null,
    };
}


export class ConnectorLiveproxiesB2bService implements IConnectorService {
    private readonly logger = new Logger(ConnectorLiveproxiesB2bService.name);

    private readonly api: LiveproxiesApi;

    constructor(
        credentialConfig: IConnectorLiveproxiesCredential,
        private readonly connectorConfig: IConnectorLiveproxiesConfig,
        agents: Agents
    ) {
        this.api = new LiveproxiesApi(
            credentialConfig.apiKey,
            agents
        );
    }

    async getProxies(keys: string[]): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`getProxies(): keys.length=${keys.length}`);

        const plans = await this.api.getAllPlans() as ILiveproxiesPlanB2B[];
        const plan = plans.find((p) => p.packageId === this.connectorConfig.packageId);

        if (!plan) {
            throw new Error(`Plan ${this.connectorConfig.packageId} not found`);
        }

        if (plan.productName !== 'ENTERPRISE') {
            throw new Error(`Plan ${this.connectorConfig.packageId} is not ENTERPRISE`);
        }

        const proxies: IConnectorProxyRefreshed[] = keys.map((key) => convertToProxy(
            key,
            this.connectorConfig.country,
            plan
        ));

        return proxies;
    }

    async createProxies(
        count: number, totalCount: number, excludeKeys: string[]
    ): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`createProxies(): count=${count} / totalCount=${totalCount} / excludeKeys.length=${excludeKeys.length}`);

        const plans = await this.api.getAllPlans() as ILiveproxiesPlanB2B[];
        const plan = plans.find((p) => p.packageId === this.connectorConfig.packageId);

        if (!plan) {
            throw new Error(`Plan not found: ${this.connectorConfig.packageId}`);
        }

        if (plan.productName !== 'ENTERPRISE') {
            throw new Error(`Plan ${this.connectorConfig.packageId} is not ENTERPRISE`);
        }

        const excludeKeysSet = new Set<string>(excludeKeys);
        const newProxies: IConnectorProxyRefreshed[] = [];
        while (newProxies.length < count) {
            const key = (Math.floor(Math.random() * 1000000) + 1).toString(10);

            if (excludeKeysSet.has(key)) {
                continue;
            }

            const proxy = convertToProxy(
                key,
                this.connectorConfig.country,
                plan
            );

            newProxies.push(proxy);
            excludeKeysSet.add(key);
        }

        return newProxies;
    }

    async startProxies(): Promise<void> {
        // Not used
    }

    async removeProxies(keys: IProxyKeyToRemove[]): Promise<string[]> {
        this.logger.debug(`removeProxies(): keys.length=${keys.length}`);

        return keys.map((p) => p.key);
    }
}
