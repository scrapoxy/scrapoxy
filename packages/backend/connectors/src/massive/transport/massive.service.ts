import { Injectable } from '@nestjs/common';
import {
    ATransportResidentialService,

    TransportprovidersService,
} from '@scrapoxy/backend-sdk';
import { TRANSPORT_MASSIVE_RESIDENTIAL_TYPE } from './massive.constants';
import type {
    IConnectorMassiveConfig,
    IConnectorMassiveCredential,
    IMassiveSessionOptions,
} from '../massive.interface';
import type { IProxyToConnectConfigResidential } from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IConnectorToRefresh,
} from '@scrapoxy/common';


function formatUsername(
    username: string, options: IMassiveSessionOptions
): string {
    const lines = [
        username, `session-${options.session}`, 'sessionttl-60',
    ];

    if (options.country !== 'all') {
        lines.push(`country-${options.country.toUpperCase()}`);
    }

    return lines.join('-');
}


@Injectable()
export class TransportMassiveResidentialService extends ATransportResidentialService {
    readonly type = TRANSPORT_MASSIVE_RESIDENTIAL_TYPE;

    constructor(transportproviders: TransportprovidersService) {
        super();

        transportproviders.register(this);
    }

    completeProxyConfig(
        proxy: IConnectorProxyRefreshed, connector: IConnectorToRefresh
    ) {
        const
            connectorConfig = connector.connectorConfig as IConnectorMassiveConfig,
            credentialConfig = connector.credentialConfig as IConnectorMassiveCredential,
            proxyConfig = proxy.config as IProxyToConnectConfigResidential;

        proxyConfig.address = {
            hostname: 'network.joinmassive.com',
            port: 65534,
        };
        proxyConfig.username = formatUsername(
            credentialConfig.username,
            {
                ...connectorConfig,
                session: proxy.key,
            }
        );
        proxyConfig.password = credentialConfig.password;
    }
}
