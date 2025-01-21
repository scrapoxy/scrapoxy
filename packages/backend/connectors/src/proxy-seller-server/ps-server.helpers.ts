import { TRANSPORT_PROXY_TYPE } from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_PROXY_SELLER_SERVER_TYPE,
    EProxySellerNetworkType,
    EProxyStatus,
    EProxyType,
} from '@scrapoxy/common';
import { EProxySellerProxyProtocol } from './ps-server.interface';
import type { IProxySellerProxy } from './ps-server.interface';
import type {
    IConnectorProxyRefreshed,
    IProxyTransport,
} from '@scrapoxy/common';


function getName(proxy: IProxySellerProxy): string {
    switch (proxy.networkType) {
        case EProxySellerNetworkType.IPV4:
        case EProxySellerNetworkType.IPV6: {
            return `DC${proxy.id}`;
        }

        case EProxySellerNetworkType.ISP: {
            return `ISP${proxy.id}`;
        }

        case EProxySellerNetworkType.MOBILE: {
            return `MOB${proxy.id}`;
        }

        default: {
            throw new Error(`Unknown network type: ${proxy.networkType} for proxy ${proxy.id}`);
        }
    }
}


export function convertToProxy(
    proxy: IProxySellerProxy,
    country: string
): IConnectorProxyRefreshed | undefined {
    if (!proxy) {
        return;
    }

    let
        port: number | null,
        proxyType: EProxyType;
    switch (proxy.protocol) {
        case EProxySellerProxyProtocol.HTTP: {
            proxyType = EProxyType.HTTP;
            port = proxy.port_http;
            break;
        }

        case EProxySellerProxyProtocol.SOCKS: {
            proxyType = EProxyType.SOCKS5;
            port = proxy.port_socks;
            break;
        }

        default: {
            throw new Error(`Unknown proxy protocol: ${proxy.protocol} for proxy ${proxy.id}`);
        }
    }

    if (!port) {
        throw new Error(`Port is undefined for proxy ${proxy.id}`);
    }

    const config: IProxyTransport = {
        type: proxyType,
        address: {
            hostname: proxy.ip_only,
            port,
        },
        auth: {
            username: proxy.login,
            password: proxy.password,
        },
    };
    const p: IConnectorProxyRefreshed = {
        type: CONNECTOR_PROXY_SELLER_SERVER_TYPE,
        transportType: TRANSPORT_PROXY_TYPE,
        key: proxy.id.toString(),
        name: getName(proxy),
        status: EProxyStatus.STARTED,
        removingForceCap: false,
        config,
        countryLike: country !== 'all' ? country : null,
    };

    return p;
}
