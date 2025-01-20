import { TRANSPORT_PROXY_TYPE } from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_PROXY_CHEAP_SERVER_TYPE,
    EProxyStatus,
    EProxyType,
} from '@scrapoxy/common';
import {
    EProxyCheapNetworkType,
    EProxyCheapProxyType,
} from './pc-server.interface';
import type { IProxyCheapProxy } from './pc-server.interface';
import type {
    IConnectorProxyRefreshed,
    IProxyTransport,
} from '@scrapoxy/common';


function getName(proxy: IProxyCheapProxy): string {
    switch (proxy.networkType) {
        case EProxyCheapNetworkType.DATACENTER: {
            return `DC${proxy.id}`;
        }

        case EProxyCheapNetworkType.RESIDENTIAL_STATIC: {
            return `ISP${proxy.id}`;
        }

        case EProxyCheapNetworkType.MOBILE: {
            return `MOB${proxy.id}`;
        }

        default: {
            throw new Error(`Unknown network type: ${proxy.networkType} for proxy ${proxy.id}`);
        }
    }
}


export function convertToProxy(proxy: IProxyCheapProxy): IConnectorProxyRefreshed | undefined {
    if (!proxy) {
        return;
    }

    let
        port: number | null,
        proxyType: EProxyType;
    switch (proxy.proxyType) {
        case EProxyCheapProxyType.HTTP: {
            proxyType = EProxyType.HTTP;
            port = proxy.connection.httpPort;
            break;
        }

        case EProxyCheapProxyType.HTTPS: {
            proxyType = EProxyType.HTTP; // Force HTTP port
            port = proxy.connection.httpsPort;
            break;
        }

        case EProxyCheapProxyType.SOCKS5: {
            proxyType = EProxyType.SOCKS5;
            port = proxy.connection.socks5Port;
            break;
        }

        default: {
            throw new Error(`Unknown proxy type: ${proxy.proxyType} for proxy ${proxy.id}`);
        }
    }

    if (!port) {
        throw new Error(`Port is undefined for proxy ${proxy.id}`);
    }

    const config: IProxyTransport = {
        type: proxyType,
        address: {
            hostname: proxy.connection.connectIp,
            port,
        },
        auth: {
            username: proxy.authentication.username,
            password: proxy.authentication.password,
        },
    };
    const p: IConnectorProxyRefreshed = {
        type: CONNECTOR_PROXY_CHEAP_SERVER_TYPE,
        transportType: TRANSPORT_PROXY_TYPE,
        key: proxy.id.toString(),
        name: getName(proxy),
        status: EProxyStatus.STARTED,
        removingForceCap: false,
        config,
        countryLike: null,
    };

    return p;
}
