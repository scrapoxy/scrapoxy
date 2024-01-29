import { Logger } from '@nestjs/common';
import {
    CONNECTOR_XPROXY_TYPE,
    EProxyStatus,
    EProxyType,
    safeJoin,
} from '@scrapoxy/common';
import { IXproxyApi } from './api';
import { Agents } from '../../helpers';
import type {
    IConnectorXProxyCredential,
    IXProxyDevice,
} from './xproxy.interface';
import type { IConnectorService } from '../providers.interface';
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
        key: d.position.toString(10),
        name: `${d.host}:${d.proxy_port}`,
        status,
        config,
    };

    return p;
}


export class ConnectorXProxyService implements IConnectorService {
    private readonly logger = new Logger(ConnectorXProxyService.name);

    private readonly api: IXproxyApi;

    constructor(
        private readonly credentialConfig: IConnectorXProxyCredential,
        agents: Agents
    ) {
        this.api = new IXproxyApi(
            this.credentialConfig.apiUrl,
            this.credentialConfig.apiUsername,
            this.credentialConfig.apiPassword,
            agents
        );
    }

    async getProxies(keys: string[]): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`getProxies(): keys=${safeJoin(keys)}`);

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
        count: number, excludeKeys: string[]
    ): Promise<IConnectorProxyRefreshed[]> {
        this.logger.debug(`createProxies(): count=${count} / excludeKeys=${safeJoin(excludeKeys)}`);

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

    async startProxies(keys: string[]): Promise<void> {
        this.logger.debug(`startProxies(): keys=${safeJoin(keys)}`);

        // Not used
    }

    async removeProxies(keys: IProxyKeyToRemove[]): Promise<string[]> {
        const proxiesKeys = keys.map((p) => p.key);
        this.logger.debug(`removeProxies(): keys=${safeJoin(proxiesKeys)}`);

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

        return proxiesKeys;
    }
}
