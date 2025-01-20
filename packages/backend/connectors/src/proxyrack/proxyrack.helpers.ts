import {
    CONNECTOR_PROXYRACK_TYPE,
    EProxyStatus,
} from '@scrapoxy/common';
import {
    EProxyrackOs,
    EProxyrackProductType,
} from './proxyrack.interface';
import { TRANSPORT_PROXYRACK_TYPE } from './transport/proxyrack.constants';
import type {
    IProxyrackSession,
    IProxyrackSessionOptions,
} from './proxyrack.interface';
import type { IConnectorProxyRefreshed } from '@scrapoxy/common';


export function formatUsername(
    username: string, options: IProxyrackSessionOptions
): string {
    const lines = [
        username, `session-${options.session}`,
    ];

    if (options.country !== 'all') {
        lines.push(`country-${options.country.toUpperCase()}`);

        if (options.city !== 'all') {
            lines.push(`city-${options.city}`);
        }

        if (options.isp !== 'all') {
            lines.push(`isp-${options.isp}`);
        }
    }

    if (options.osName !== EProxyrackOs.All) {
        lines.push(`osName-${options.osName}`);
    }

    return lines.join('-');
}


export function productToHostname(product: EProxyrackProductType): string {
    switch (product) {
        case EProxyrackProductType.PrivateUnmeteredResidential: {
            return 'private.residential.proxyrack.net';
            break;
        }

        default: {
            throw new Error(`Unknown product type: ${product}`);
        }
    }
}


export function convertSessionToProxy(
    session: IProxyrackSession,
    country: string
): IConnectorProxyRefreshed {
    const p: IConnectorProxyRefreshed = {
        type: CONNECTOR_PROXYRACK_TYPE,
        transportType: TRANSPORT_PROXYRACK_TYPE,
        key: session.session,
        name: session.session,
        status: session.proxy.online ? EProxyStatus.STARTED : EProxyStatus.STARTING,
        removingForceCap: true,
        config: {},
        countryLike: country !== 'all' ? country : null,
    };

    return p;
}


export function convertNameToProxy(
    name: string,
    country: string
): IConnectorProxyRefreshed {
    const p: IConnectorProxyRefreshed = {
        type: CONNECTOR_PROXYRACK_TYPE,
        transportType: TRANSPORT_PROXYRACK_TYPE,
        key: name,
        name,
        status: EProxyStatus.STARTING,
        removingForceCap: true,
        config: {},
        countryLike: country !== 'all' ? country : null,
    };

    return p;
}
