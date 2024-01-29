import { Injectable } from '@nestjs/common';
import { TRANSPORT_IPROYAL_RESIDENTIAL_TYPE } from './iproyal-residential.constants';
import {
    ATransportResidentialService,
    TransportprovidersService,
} from '../../../transports';
import type { IProxyToConnectConfigIproyalResidential } from './iproyal-residential.interface';
import type {
    IConnectorIproyalResidentialConfig,
    IConnectorIproyalResidentialCredential,
    IIproyalResidentialSessionOptions,
} from '../iproyal-residential.interface';
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

        if (options.state !== 'all') {
            lines.push(`state-${options.city}`);
        }

        if (options.city !== 'all') {
            lines.push(`city-${options.city}`);
        }
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
            proxyConfig = proxy.config as IProxyToConnectConfigIproyalResidential;

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
