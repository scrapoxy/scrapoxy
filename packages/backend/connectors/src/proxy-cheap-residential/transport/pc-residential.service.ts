import { Injectable } from '@nestjs/common';
import {
    ATransportResidentialService,

    TransportprovidersService,
} from '@scrapoxy/backend-sdk';
import { TRANSPORT_PROXY_CHEAP_RESIDENTIAL_TYPE } from './pc-residential.constants';
import type {
    IConnectorProxyCheapResidentialConfig,
    IConnectorProxyCheapResidentialCredential,
    IProxyCheapResidentialSessionOptions,
} from '../pc-residential.interface';
import type { IProxyToConnectConfigResidential } from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IConnectorToRefresh,
} from '@scrapoxy/common';


function formatPassword(
    password: string, options: IProxyCheapResidentialSessionOptions
): string {
    const lines = [
        password,
    ];

    if (options.country !== 'All') {
        lines.push(`country-${options.country}`);
    }

    lines.push(`session-${options.session}`);

    return lines.join('_');
}


@Injectable()
export class TransportProxyCheapResidentialService extends ATransportResidentialService {
    readonly type = TRANSPORT_PROXY_CHEAP_RESIDENTIAL_TYPE;

    constructor(transportproviders: TransportprovidersService) {
        super();

        transportproviders.register(this);
    }

    completeProxyConfig(
        proxy: IConnectorProxyRefreshed, connector: IConnectorToRefresh
    ) {
        const
            connectorConfig = connector.connectorConfig as IConnectorProxyCheapResidentialConfig,
            credentialConfig = connector.credentialConfig as IConnectorProxyCheapResidentialCredential,
            proxyConfig = proxy.config as IProxyToConnectConfigResidential;

        proxyConfig.address = {
            hostname: 'proxy.proxy-cheap.com',
            port: 31112,
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
