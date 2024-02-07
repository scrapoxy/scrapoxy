import { Logger } from '@nestjs/common';
import { Agents } from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_PROXIDIZE_TYPE,
    EProxyStatus,
    EProxyType,
} from '@scrapoxy/common';
import { ProxidizeApi } from './api';
import { EProxidizeDeviceStatus } from './proxidize.interface';
import type {
    IConnectorProxidizeCredential,
    IProxidizeDevice,
} from './proxidize.interface';
import type { IConnectorService } from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IProxyKeyToRemove,
    IProxyTransport,
} from '@scrapoxy/common';


function convertStatus(status: EProxidizeDeviceStatus): EProxyStatus {
    if (!status) {
        return EProxyStatus.ERROR;
    }

    switch (status) {
        case EProxidizeDeviceStatus.CONNECTED:
            return EProxyStatus.STARTED;
        case EProxidizeDeviceStatus.ROTATING:
            return EProxyStatus.STARTING;
        case EProxidizeDeviceStatus.NOSERVICE:
            return EProxyStatus.STOPPED;
        default:
            return EProxyStatus.ERROR;
    }
}


function convertToProxy(
    d: IProxidizeDevice,
    hostname: string
): IConnectorProxyRefreshed {
    const config: IProxyTransport = {
        type: EProxyType.HTTP,
        address: {
            hostname,
            port: d.Port,
        },
        auth: null,
    };
    const p: IConnectorProxyRefreshed = {
        type: CONNECTOR_PROXIDIZE_TYPE,
        key: d.Index.toString(10),
        name: d.public_ip_http_ipv4,
        status: convertStatus(d.Status),
        config,
    };

    return p;
}


export class ConnectorProxidizeService implements IConnectorService {
    private readonly logger = new Logger(ConnectorProxidizeService.name);

    private readonly api: ProxidizeApi;

    constructor(
        private readonly credentialConfig: IConnectorProxidizeCredential,
        agents: Agents
    ) {
        this.api = new ProxidizeApi(
            this.credentialConfig.apiUrl,
            this.credentialConfig.apiToken,
            agents
        );
    }

    async getProxies(keys: string[]): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`getProxies(): keys.length=${keys.length}`);

        const devices = await this.api.getDevices();
        const proxies = devices
            .filter((d) => keys.includes(d.Index.toString(10)))
            .map((d) => convertToProxy(
                d,
                this.credentialConfig.proxyHostname
            ));

        return proxies;
    }

    async createProxies(
        count: number, excludeKeys: string[]
    ): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`createProxies(): count=${count} / excludeKeys.length=${excludeKeys.length}`);

        const devices = await this.api.getDevices();
        const proxies = devices
            .filter((d) => !excludeKeys.includes(d.Index.toString(10)))
            .slice(
                0,
                count
            )
            .map((d) => convertToProxy(
                d,
                this.credentialConfig.proxyHostname
            ));

        return proxies;
    }

    async startProxies(keys: string[]): Promise<void> {
        this.logger.debug(`startProxies(): keys.length=${keys.length}`);

        // Not used
    }

    async removeProxies(keys: IProxyKeyToRemove[]): Promise<string[]> {
        this.logger.debug(`removeProxies(): keys.length=${keys.length}`);

        const promises = keys
            .map((proxy) => {
                const index = parseInt(
                    proxy.key,
                    10
                );

                if (proxy.force) {
                    return this.api.rebootDevice(index);
                } else {
                    return this.api.rotateDevice(index);
                }
            });

        await Promise.all(promises);

        return keys.map((p) => p.key);
    }
}
