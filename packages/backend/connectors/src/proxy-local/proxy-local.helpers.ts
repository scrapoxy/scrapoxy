import {
    CONNECTOR_PROXY_LOCAL_TYPE,
    EProxyStatus,
} from '@scrapoxy/common';
import { TRANSPORT_PROXY_LOCAL_TYPE } from './transport/proxy-local.constants';
import type { IConnectorProxyRefreshedConfigProxyLocal } from './transport/proxy-local.interface';
import type { IConnectorProxyRefreshed } from '@scrapoxy/common';


const REGION_TO_COUNTRY: Record<string, string> = {
    europe: 'fr',
    asia: 'jp',
    america: 'us',
    australia: 'au',
};


function convertRegion(region: string | null | undefined): string | null {
    if (!region) {
        return null;
    }

    return REGION_TO_COUNTRY[ region ] ?? null;
}


export function convertToProxy(
    url: string,
    session: string,
    region: string
): IConnectorProxyRefreshed {
    const config: IConnectorProxyRefreshedConfigProxyLocal = {
        url,
    };
    const proxy: IConnectorProxyRefreshed = {
        type: CONNECTOR_PROXY_LOCAL_TYPE,
        transportType: TRANSPORT_PROXY_LOCAL_TYPE,
        key: session,
        name: session,
        status: EProxyStatus.STARTED,
        config,
        countryLike: convertRegion(region),
    };

    return proxy;
}
