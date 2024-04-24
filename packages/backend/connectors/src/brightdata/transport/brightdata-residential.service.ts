import { Injectable } from '@nestjs/common';
import { TransportprovidersService } from '@scrapoxy/backend-sdk';
import { ATransportBrightdataService } from './brightdata.abstract';
import { TRANSPORT_BRIGHTDATA_RESIDENTIAL_TYPE } from './brightdata.constants';
import type { IConnectorBrightdataConfig } from '../brightdata.interface';
import type { IProxyToConnectConfigResidential } from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IConnectorToRefresh,
} from '@scrapoxy/common';


function formatUsername(
    customerId: string,
    zone: string,
    country: string,
    session: string
): string {
    const lines = [
        'brd-customer',
        customerId,
        'zone',
        zone,
        'session',
        session,
    ];

    if (country !== 'all') {
        lines.push(
            'country',
            country
        );
    }

    return lines.join('-');
}

@Injectable()
export class TransportBrightdataResidentialService extends ATransportBrightdataService {
    readonly type = TRANSPORT_BRIGHTDATA_RESIDENTIAL_TYPE;

    constructor(transportproviders: TransportprovidersService) {
        super();

        transportproviders.register(this);
    }

    completeProxyConfig(
        proxy: IConnectorProxyRefreshed, connector: IConnectorToRefresh
    ) {
        const
            connectorConfig = connector.connectorConfig as IConnectorBrightdataConfig,
            proxyConfig = proxy.config as IProxyToConnectConfigResidential;

        proxyConfig.address = {
            hostname: 'brd.superproxy.io',
            port: 22225,
        };

        proxyConfig.username = formatUsername(
            proxyConfig.username,
            connectorConfig.zoneName,
            connectorConfig.country,
            proxy.key
        );
    }
}
