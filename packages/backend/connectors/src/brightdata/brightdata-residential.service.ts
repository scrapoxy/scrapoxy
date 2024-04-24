import { Logger } from '@nestjs/common';
import { Agents } from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_BRIGHTDATA_TYPE,
    EProxyStatus,
    randomName,
} from '@scrapoxy/common';
import { BrightdataApi } from './api';
import { getBrightdataPrefix } from './brightdata.helpers';
import { TRANSPORT_BRIGHTDATA_RESIDENTIAL_TYPE } from './transport';
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


function convertToProxy(
    key: string,
    username: string,
    password: string
): IConnectorProxyRefreshed {
    const config: ITransportProxyRefreshedConfigBrightdata = {
        username,
        password,
    };
    const p: IConnectorProxyRefreshed = {
        type: CONNECTOR_BRIGHTDATA_TYPE,
        transportType: TRANSPORT_BRIGHTDATA_RESIDENTIAL_TYPE,
        key,
        name: key,
        status: EProxyStatus.STARTED,
        config,
    };

    return p;
}


export class ConnectorBrightdataResidentialService implements IConnectorService {
    private readonly logger = new Logger(ConnectorBrightdataResidentialService.name);

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

        return this.convertProxiesFromKeys(keys);
    }

    async createProxies(
        count: number, totalCount: number, excludeKeys: string[]
    ): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`createProxies(): count=${count} / totalCount=${totalCount} / excludeKeys.length=${excludeKeys.length}`);

        const prefix = getBrightdataPrefix(this.connectorConfig.zoneType);
        const keys: string[] = [];
        for (let i = 0; i < count; ++i) {
            keys.push(randomName(prefix));
        }

        return this.convertProxiesFromKeys(keys);
    }

    async startProxies(): Promise<void> {
        // Not used
    }

    async removeProxies(keys: IProxyKeyToRemove[]): Promise<string[]> {
        this.logger.debug(`removeProxies(): keys.length=${keys.length}`);

        return keys.map((k) => k.key);
    }

    private async convertProxiesFromKeys(keys: string[]): Promise<IConnectorProxyRefreshed[]> {
        const status = await this.api.getStatus();
        const zone = await this.api.getZone(this.connectorConfig.zoneName);
        const proxies = keys.map((key) => convertToProxy(
            key,
            status.customer,
            zone.password[ 0 ]
        ));

        return proxies;
    }
}
