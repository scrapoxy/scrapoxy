import {
    CONNECTOR_NIMBLEWAY_TYPE,
    EProxyStatus,
} from '@scrapoxy/common';
import { TRANSPORT_NIMBLEWAY_TYPE } from './transport/nimbleway.constants';
import type { INimblewaySessionOptions } from './nimbleway.interface';
import type {
    IConnectorProxyRefreshed,
    INimblewayGeoItem,
} from '@scrapoxy/common';


export function formatUsername(
    username: string, options: INimblewaySessionOptions
): string {
    const lines = [
        `account-${username}`, 'pipeline-nimbleip',
    ];

    if (options.country !== 'all') {
        lines.push(`country-${options.country.toUpperCase()}`);
    }

    lines.push(`session-${options.session}`);

    return lines.join('-');
}


export function toNimblewayGeoItem(i: INimblewayGeoItem): INimblewayGeoItem {
    const item: INimblewayGeoItem = {
        code: i.code.toLowerCase(),
        name: i.name,
    };

    return item;
}


export function convertToProxy(
    key: string,
    country: string
): IConnectorProxyRefreshed {
    const p: IConnectorProxyRefreshed = {
        type: CONNECTOR_NIMBLEWAY_TYPE,
        transportType: TRANSPORT_NIMBLEWAY_TYPE,
        key: key,
        name: key,
        status: EProxyStatus.STARTED,
        removingForceCap: false,
        config: {},
        countryLike: country !== 'all' ? country : null,
    };

    return p;
}
