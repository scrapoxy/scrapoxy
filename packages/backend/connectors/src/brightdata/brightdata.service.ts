import { Logger } from '@nestjs/common';
import { Agents } from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_BRIGHTDATA_TYPE,
    EProxyStatus,
} from '@scrapoxy/common';
import { BrightdataApi } from './api';
import { EBrightdataProductType } from './brightdata.interface';
import { TRANSPORT_BRIGHTDATA_TYPE } from './transport/brightdata.constants';
import type {
    IConnectorBrightdataConfig,
    IConnectorBrightdataCredential,
    ITransportProxyRefreshedConfigBrightdata,
} from './brightdata.interface';
import type { IConnectorService } from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IProxyKeyToRemove,
} from '@scrapoxy/common';


function getPrefix(zoneType: EBrightdataProductType): string {
    switch (zoneType) {
        case EBrightdataProductType.DATACENTER: {
            return 'DCT';
        }

        case EBrightdataProductType.ISP: {
            return 'ISP';
        }

        case EBrightdataProductType.RESIDENTIAL: {
            return 'RES';
        }

        case EBrightdataProductType.MOBILE: {
            return 'MOB';
        }
    }
}


function convertToProxy(
    key: string, username: string, password: string
): IConnectorProxyRefreshed {
    const config: ITransportProxyRefreshedConfigBrightdata = {
        username,
        password,
    };
    const p: IConnectorProxyRefreshed = {
        type: CONNECTOR_BRIGHTDATA_TYPE,
        transportType: TRANSPORT_BRIGHTDATA_TYPE,
        key,
        name: key,
        status: EProxyStatus.STARTED,
        config,
    };

    return p;
}


export class ConnectorBrightdataService implements IConnectorService {
    private readonly logger = new Logger(ConnectorBrightdataService.name);

    private readonly api: BrightdataApi;

    constructor(
        credentialConfig: IConnectorBrightdataCredential,
        private readonly connectorConfig: IConnectorBrightdataConfig,
        agents: Agents
    ) {
        this.api = new BrightdataApi(
            credentialConfig.token,
            agents
        );
    }

    async getProxies(keys: string[]): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`getProxies(): keys.length=${keys.length}`);

        const proxies = await this.getActiveProxies();
        const proxiesFiltered = proxies.filter((p) => keys.includes(p.key));

        return proxiesFiltered;
    }

    async createProxies(
        count: number, totalCount: number, excludeKeys: string[]
    ): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`createProxies(): count=${count} / totalCount=${totalCount} / excludeKeys.length=${excludeKeys.length}`);

        const proxies = await this.getActiveProxies();
        const proxiesFiltered = proxies
            .filter((p) => !excludeKeys.includes(p.key))
            .slice(
                0,
                count
            );

        return proxiesFiltered;
    }

    async startProxies(): Promise<void> {
        // Not used
    }

    async removeProxies(keys: IProxyKeyToRemove[]): Promise<string[]> {
        this.logger.debug(`removeProxies(): keys.length=${keys.length}`);

        const ipsForced = keys.filter((k) => k.force)
            .map((k) => k.key.slice(3));

        if (ipsForced.length > 0) {
            await this.api.refreshStaticIps(
                this.connectorConfig.zone,
                ipsForced
            );
        }

        return keys.map((k) => k.key);
    }

    private async getActiveProxies() {
        const status = await this.api.getStatus();
        const zone = await this.api.getZone(this.connectorConfig.zone);
        const ips = await this.api.getZoneRouteIps(this.connectorConfig.zone);
        const prefix = getPrefix(zone.plan.product);
        const proxies = ips
            .map((ip) => convertToProxy(
                `${prefix}${ip}`,
                status.customer,
                zone.password[ 0 ]
            ));

        return proxies;
    }
}
