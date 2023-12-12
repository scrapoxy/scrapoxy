import { Injectable } from '@nestjs/common';
import {
    ATransportCloudService,
    TransportprovidersService,
} from '@scrapoxy/backend-sdk';
import { TRANSPORT_CLOUDLOCAL_TYPE } from './cloudlocal.constants';
import type { IProxyToConnectConfigCloudlocal } from './cloudlocal.interface';
import type { IConnectorCloudlocalConfig } from '../cloudlocal.interface';
import type { IHttpOptions } from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IConnectorToRefresh,
    IProxyToConnect,
} from '@scrapoxy/common';
import type { ISockets } from '@scrapoxy/proxy-sdk';
import type {
    ClientRequestArgs,
    OutgoingHttpHeaders,
} from 'http';


@Injectable()
export class TransportCloudlocalService extends ATransportCloudService {
    readonly type = TRANSPORT_CLOUDLOCAL_TYPE;

    constructor(transportproviders: TransportprovidersService) {
        super();

        transportproviders.register(this);
    }

    completeProxyConfig(
        proxy: IConnectorProxyRefreshed, connector: IConnectorToRefresh
    ) {
        const
            connectorConfig = connector.connectorConfig as IConnectorCloudlocalConfig,
            proxyConfig = proxy.config as IProxyToConnectConfigCloudlocal;

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
            countryCode: 'FR',
            cityName: 'Paris',
            latitude: 48.8566,
            longitude: 2.3522,
            timezone: 'Europe/Paris',
        };
    }

    override buildFingerprintRequestArgs(
        method: string | undefined,
        urlOpts: IHttpOptions,
        headers: OutgoingHttpHeaders,
        headersConnect: OutgoingHttpHeaders,
        proxy: IProxyToConnect,
        sockets: ISockets,
        timeout: number
    ): ClientRequestArgs {
        const
            args = super.buildFingerprintRequestArgs(
                method,
                urlOpts,
                headers,
                headersConnect,
                proxy,
                sockets,
                timeout
            ),
            config = proxy.config as IProxyToConnectConfigCloudlocal;

        if (config.fingerprintForce) {
            headers[ 'X-Fingerprint' ] = btoa(JSON.stringify(config.fingerprintForce));
        }

        return args;
    }
}
