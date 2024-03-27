import { Injectable } from '@nestjs/common';
import {
    ATransportResidentialService,

    TransportprovidersService,
} from '@scrapoxy/backend-sdk';
import { TRANSPORT_PROXYRACK_TYPE } from './proxyrack.constants';
import { DEFAULT_PROXYRACK_PORT } from '../api';
import {
    formatUsername,
    productToHostname,
} from '../proxyrack.helpers';
import type {
    IConnectorProxyrackConfig,
    IConnectorProxyrackCredential,
} from '../proxyrack.interface';
import type { IProxyToConnectConfigResidential } from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IConnectorToRefresh,
} from '@scrapoxy/common';


@Injectable()
export class TransportProxyrackService extends ATransportResidentialService {
    readonly type = TRANSPORT_PROXYRACK_TYPE;

    constructor(transportproviders: TransportprovidersService) {
        super();

        transportproviders.register(this);
    }

    completeProxyConfig(
        proxy: IConnectorProxyRefreshed, connector: IConnectorToRefresh
    ) {
        const
            connectorConfig = connector.connectorConfig as IConnectorProxyrackConfig,
            credentialConfig = connector.credentialConfig as IConnectorProxyrackCredential,
            proxyConfig = proxy.config as IProxyToConnectConfigResidential;

        proxyConfig.address = {
            hostname: productToHostname(credentialConfig.product),
            port: DEFAULT_PROXYRACK_PORT,
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
