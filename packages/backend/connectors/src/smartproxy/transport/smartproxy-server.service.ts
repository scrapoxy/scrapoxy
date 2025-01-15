import { Injectable } from '@nestjs/common';
import { TransportprovidersService } from '@scrapoxy/backend-sdk';
import { ATransportSmartproxyService } from './smartproxy.abstract';
import { TRANSPORT_SMARTPROXY_SERVER_TYPE } from './smartproxy.constants';
import type { IConnectorSmartproxyConfig } from '../smartproxy.interface';
import type { IProxyToConnectConfigResidential } from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IConnectorToRefresh,
} from '@scrapoxy/common';


function formatUsername(
    username: string,
    country: string
): string {
    const lines = [
        'user', username,
    ];

    if (country !== 'all') {
        lines.push('country');
        lines.push(country.toLowerCase());
    }

    return lines.join('-');
}


@Injectable()
export class TransportSmartproxyServerService extends ATransportSmartproxyService {
    readonly type = TRANSPORT_SMARTPROXY_SERVER_TYPE;

    constructor(transportproviders: TransportprovidersService) {
        super();

        transportproviders.register(this);
    }

    completeProxyConfig(
        proxy: IConnectorProxyRefreshed, connector: IConnectorToRefresh
    ) {
        const
            connectorConfig = connector.connectorConfig as IConnectorSmartproxyConfig,
            proxyConfig = proxy.config as IProxyToConnectConfigResidential;

        proxyConfig.username = formatUsername(
            proxyConfig.username,
            connectorConfig.country
        );
    }
}
