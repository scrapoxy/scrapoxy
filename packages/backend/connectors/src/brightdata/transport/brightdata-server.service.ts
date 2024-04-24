import { Injectable } from '@nestjs/common';
import {
    ATransportResidentialService,
    TransportprovidersService,
} from '@scrapoxy/backend-sdk';
import { TRANSPORT_BRIGHTDATA_SERVER_TYPE } from './brightdata.constants';
import type { IConnectorBrightdataConfig } from '../brightdata.interface';
import type { IProxyToConnectConfigResidential } from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IConnectorToRefresh,
} from '@scrapoxy/common';


function formatUsername(
    customerId: string,
    zone: string,
    session: string,
    ip: string
): string {
    return [
        'brd-customer',
        customerId,
        'zone',
        zone,
        'session',
        session,
        'ip',
        ip,
    ].join('-');
}


@Injectable()
export class TransportBrightdataServerService extends ATransportResidentialService {
    readonly type = TRANSPORT_BRIGHTDATA_SERVER_TYPE;

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

        const ip = proxy.key.slice(3);

        proxyConfig.username = formatUsername(
            proxyConfig.username,
            connectorConfig.zoneName,
            proxy.key,
            ip
        );
    }
}
