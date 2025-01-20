import { TRANSPORT_PROXY_TYPE } from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_IPROYAL_SERVER_TYPE,
    EProxyStatus,
    EProxyType,
    getCountryCode,


} from '@scrapoxy/common';
import type { IIproyalServerProxy } from './iproyal-server.interface';
import type {
    IConnectorProxyRefreshed,
    IProxyTransport,
} from '@scrapoxy/common';


export function convertToProxy(
    proxy: IIproyalServerProxy,
    country: string
): IConnectorProxyRefreshed | undefined {
    if (!proxy?.ip_address || proxy.ip_address.length <= 0 ||
        !proxy.port || proxy.port <= 0 ||
        !proxy.username || proxy.username.length <= 0 ||
        !proxy.password || proxy.password.length <= 0) {
        return;
    }

    let countryLike: string | null;

    if (country !== 'all') {
        countryLike = getCountryCode(country) ?? null;
    } else {
        countryLike = null;
    }

    const config: IProxyTransport = {
        type: EProxyType.HTTP,
        address: {
            hostname: proxy.ip_address,
            port: proxy.port,
        },
        auth: {
            username: proxy.username,
            password: proxy.password,
        },
    };
    const key = proxy.id.toString();
    const p: IConnectorProxyRefreshed = {
        type: CONNECTOR_IPROYAL_SERVER_TYPE,
        transportType: TRANSPORT_PROXY_TYPE,
        key,
        name: key,
        status: EProxyStatus.STARTED,
        removingForceCap: false,
        config,
        countryLike,
    };

    return p;
}
