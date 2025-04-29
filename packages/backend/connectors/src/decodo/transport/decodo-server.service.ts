import { Injectable } from '@nestjs/common';
import { TransportprovidersService } from '@scrapoxy/backend-sdk';
import { ATransportDecodoService } from './decodo.abstract';
import { TRANSPORT_DECODO_SERVER_TYPE } from './decodo.constants';
import type { IConnectorDecodoConfig } from '../decodo.interface';
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
export class TransportDecodoServerService extends ATransportDecodoService {
    readonly type = TRANSPORT_DECODO_SERVER_TYPE;

    constructor(transportproviders: TransportprovidersService) {
        super();

        transportproviders.register(this);
    }

    completeProxyConfig(
        proxy: IConnectorProxyRefreshed, connector: IConnectorToRefresh
    ) {
        const
            connectorConfig = connector.connectorConfig as IConnectorDecodoConfig,
            proxyConfig = proxy.config as IProxyToConnectConfigResidential;

        proxyConfig.username = formatUsername(
            proxyConfig.username,
            connectorConfig.country
        );
    }
}
