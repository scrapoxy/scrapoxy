import { Logger } from '@nestjs/common';
import {
    Agents,
    TRANSPORT_HARDWARE_TYPE,
} from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_XPROXY_TYPE,
    EProxyStatus,
    EProxyType,
} from '@scrapoxy/common';
import { XproxyApi } from './api';
import type {
    IConnectorXProxyCredential,
    IXProxyDevice,
} from './xproxy.interface';
import type { IConnectorService } from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IProxyKeyToRemove,
    IProxyTransport,
} from '@scrapoxy/common';


function convertToProxy(
    d: IXProxyDevice, hostname: string
): IConnectorProxyRefreshed {
    const config: IProxyTransport = {
        type: EProxyType.HTTP,
        address: {
            hostname,
            port: d.proxy_port,
        },
        auth: null,
    };
    let status: EProxyStatus;

    if (d.public_ip === 'CONNECT_INTERNET_ERROR') {
        status = EProxyStatus.ERROR;
    } else {
        if (d.device_extra_info.connected) {
            status = EProxyStatus.STARTED;
        } else {
            status = EProxyStatus.STARTING;
        }
    }

    const p: IConnectorProxyRefreshed = {
        type: CONNECTOR_XPROXY_TYPE,
        transportType: TRANSPORT_HARDWARE_TYPE,
        key: d.position.toString(10),
        name: `${d.host}:${d.proxy_port}`,
        status,
        config,
        countryLike: null, // Not used because it is a hardware proxy
    };

    return p;
}


export class ConnectorXProxyService implements IConnectorService {
    private readonly logger = new Logger(ConnectorXProxyService.name);

    private readonly api: XproxyApi;

    constructor(
        private readonly credentialConfig: IConnectorXProxyCredential,
        agents: Agents
    ) {
        this.api = new XproxyApi(
            this.credentialConfig.apiUrl,
            this.credentialConfig.apiUsername,
            this.credentialConfig.apiPassword,
            agents
        );
    }

    async getProxies(keys: string[]): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`getProxies(): keys.length=${keys.length}`);

        const devices = await this.api.getDevices();
        const proxies = devices
            .filter((d) => keys.includes(d.position.toString(10)))
            .map((d) => convertToProxy(
                d,
                this.credentialConfig.proxyHostname
            ));

        return proxies;
    }

    async createProxies(
        count: number, totalCount: number, excludeKeys: string[]
    ): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`createProxies(): count=${count} / totalCount=${totalCount} / excludeKeys.length=${excludeKeys.length}`);

        const devices = await this.api.getDevices();
        const proxies = devices
            .filter((d) => !excludeKeys.includes(d.position.toString(10)))
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

    async startProxies(): Promise<void> {
        // Not used
    }

    async removeProxies(keys: IProxyKeyToRemove[]): Promise<string[]> {
        this.logger.debug(`removeProxies(): keys.length=${keys.length}`);

        const promises = keys
            .map(async(proxy) => {
                const position = parseInt(
                    proxy.key,
                    0
                );

                try {
                    if (proxy.force) {
                        await this.api.rebootDevice(position);
                    } else {
                        await this.api.rotateDevice(position);
                    }
                } catch (err: any) {
                    if (err.code === 'ECONNABORTED') {
                        // Ignore this error because XProxy doesn't answer when modem has an error
                    } else {
                        throw err;
                    }
                }
            });

        await Promise.all(promises);

        return keys.map((p) => p.key);
    }
}
