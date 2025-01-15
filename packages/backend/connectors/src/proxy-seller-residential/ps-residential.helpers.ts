import { TRANSPORT_PROXY_TYPE } from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_PROXY_SELLER_RESIDENTIAL_TYPE,
    EProxyStatus,
    EProxyType,
} from '@scrapoxy/common';
import type { IProxySellerResidentList } from './ps-residential.interface';
import type {
    IConnectorProxyRefreshed,
    IProxySellerGeoCountryView,
    IProxyTransport,
} from '@scrapoxy/common';


const DEFAULT_HOSTNAME = 'res.proxy-seller.com';
const DEFAULT_PORT = 10000;


export function toProxySellerGeoCountryView(i: IProxySellerGeoCountryView): IProxySellerGeoCountryView {
    const item: IProxySellerGeoCountryView = {
        code: i.code,
        name: i.name,
    };

    return item;
}


export function convertToProxy(
    list: IProxySellerResidentList,
    index: number,
    country: string
): IConnectorProxyRefreshed {
    const config: IProxyTransport = {
        type: EProxyType.HTTP,
        address: {
            hostname: DEFAULT_HOSTNAME,
            port: DEFAULT_PORT + index,
        },
        auth: {
            username: list.login,
            password: list.password,
        },
    };
    const p: IConnectorProxyRefreshed = {
        type: CONNECTOR_PROXY_SELLER_RESIDENTIAL_TYPE,
        transportType: TRANSPORT_PROXY_TYPE,
        name: `${list.title}${index.toString(10)
            .padStart(
                5,
                '0'
            )}`,
        key: `${list.login}${index}`,
        config,
        status: EProxyStatus.STARTED,
        countryLike: country != 'all' ? country : null,
    };

    return p;
}
