import { Injectable } from '@nestjs/common';
import { TransportprovidersService } from '@scrapoxy/backend-sdk';
import { ATransportSmartproxyService } from './smartproxy.abstract';
import { TRANSPORT_SMARTPROXY_RESIDENTIAL_TYPE } from './smartproxy.constants';
import type { IConnectorSmartproxyConfig } from '../smartproxy.interface';
import type { IProxyToConnectConfigResidential } from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IConnectorToRefresh,
} from '@scrapoxy/common';


function formatUsername(
    username: string,
    sessionDuration: number
): string {
    const lines = [
        'user', username,
    ];

    if (sessionDuration !== 10) {
        lines.push('sessionduration');
        lines.push(sessionDuration.toString(10));
    }

    return lines.join('-');
}


@Injectable()
export class TransportSmartproxyResidentialService extends ATransportSmartproxyService {
    readonly type = TRANSPORT_SMARTPROXY_RESIDENTIAL_TYPE;

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
            connectorConfig.sessionDuration
        );
    }
}
