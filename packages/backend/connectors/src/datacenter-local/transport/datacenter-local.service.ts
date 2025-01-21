import { Injectable } from '@nestjs/common';
import {
    ATransportDatacenterService,
    TransportprovidersService,
} from '@scrapoxy/backend-sdk';
import { TRANSPORT_DATACENTER_LOCAL_TYPE } from './datacenter-local.constants';
import type { IProxyToConnectConfigDatacenterLocal } from './datacenter-local.interface';
import type { IConnectorDatacenterLocalConfig } from '../datacenter-local.interface';
import type {
    ArrayHttpHeaders,
    IUrlOptions,
} from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IConnectorToRefresh,
    IProxyToRefresh,
} from '@scrapoxy/common';
import type { ISockets } from '@scrapoxy/proxy-sdk';
import type {
    ClientRequestArgs,
    OutgoingHttpHeaders,
} from 'http';


@Injectable()
export class TransportDatacenterLocalService extends ATransportDatacenterService {
    readonly type = TRANSPORT_DATACENTER_LOCAL_TYPE;

    constructor(transportproviders: TransportprovidersService) {
        super();

        transportproviders.register(this);
    }

    completeProxyConfig(
        proxy: IConnectorProxyRefreshed, connector: IConnectorToRefresh
    ) {
        const
            connectorConfig = connector.connectorConfig as IConnectorDatacenterLocalConfig,
            proxyConfig = proxy.config as IProxyToConnectConfigDatacenterLocal;

        if (connector.certificate) {
            proxyConfig.certificate = connector.certificate;
        }

        proxyConfig.fingerprintForce = {
            ip: '1.1.1.1',
            useragent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ',
            asnNetwork: '1.1.1.0/24',
            asnName: 'Dummy ASN',
            continentName: connectorConfig.region,
            continentCode: 'XX',
            countryName: 'France',
            countryCode: 'fr',
            cityName: 'Paris',
            latitude: 48.8566,
            longitude: 2.3522,
            timezone: 'Europe/Paris',
        };
    }

    override buildFingerprintRequestArgs(
        method: string | undefined,
        urlOpts: IUrlOptions,
        headers: ArrayHttpHeaders,
        headersConnect: OutgoingHttpHeaders,
        proxy: IProxyToRefresh,
        sockets: ISockets
    ): ClientRequestArgs {
        const
            args = super.buildFingerprintRequestArgs(
                method,
                urlOpts,
                headers,
                headersConnect,
                proxy,
                sockets
            ),
            config = proxy.config as IProxyToConnectConfigDatacenterLocal;

        if (config.fingerprintForce) {
            headers.addHeader(
                'X-Fingerprint',
                btoa(JSON.stringify(config.fingerprintForce))
            );
        }

        return args;
    }
}
