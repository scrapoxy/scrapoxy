import { Injectable } from '@nestjs/common';
import {
    ATransportResidentialService,

    TransportprovidersService,
} from '@scrapoxy/backend-sdk';
import { TRANSPORT_IPROYAL_RESIDENTIAL_TYPE } from './iproyal-residential.constants';
import type {
    IConnectorIproyalResidentialConfig,
    IConnectorIproyalResidentialCredential,
    IIproyalResidentialSessionOptions,
} from '../iproyal-residential.interface';
import type { IProxyToConnectConfigResidential } from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IConnectorToRefresh,
} from '@scrapoxy/common';


function formatPassword(
    password: string, options: IIproyalResidentialSessionOptions
): string {
    const lines = [
        password, `session-${options.session}`, `lifetime-${options.lifetime}`,
    ];

    if (options.country !== 'all') {
        lines.push(`country-${options.country.toUpperCase()}`);
    }

    if (options.highEndPool) {
        lines.push('streaming-1');
    }

    return lines.join('_');
}


@Injectable()
export class TransportIproyalResidentialService extends ATransportResidentialService {
    readonly type = TRANSPORT_IPROYAL_RESIDENTIAL_TYPE;

    constructor(transportproviders: TransportprovidersService) {
        super();

        transportproviders.register(this);
    }

    completeProxyConfig(
        proxy: IConnectorProxyRefreshed, connector: IConnectorToRefresh
    ) {
        const
            connectorConfig = connector.connectorConfig as IConnectorIproyalResidentialConfig,
            credentialConfig = connector.credentialConfig as IConnectorIproyalResidentialCredential,
            proxyConfig = proxy.config as IProxyToConnectConfigResidential;

        proxyConfig.address = {
            hostname: 'geo.iproyal.com',
            port: 12321,
        };
        proxyConfig.username = credentialConfig.username;
        proxyConfig.password = formatPassword(
            credentialConfig.password,
            {
                ...connectorConfig,
                session: proxy.key,
            }
        );
    }
}
