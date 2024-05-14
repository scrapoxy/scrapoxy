import { IncomingMessage } from 'http';
import { Injectable } from '@nestjs/common';
import {
    ATransportResidentialService,
    TransportprovidersService,
} from '@scrapoxy/backend-sdk';
import { TRANSPORT_NETNUT_TYPE } from './netnut.constants';
import { EConnectorNetnutProxyType } from '../netnut.interface';
import type {
    IConnectorNetnutConfig,
    IConnectorNetnutCredential,
    IProxyNetnutSessionOptions,
} from '../netnut.interface';
import type { IProxyToConnectConfigResidential } from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IConnectorToRefresh,
} from '@scrapoxy/common';


function formatUsername(
    username: string, options: IProxyNetnutSessionOptions
): string {
    let country = options.country;

    if (options.proxyType === EConnectorNetnutProxyType.MOB) {
        if (options.country === 'us') {
            country = 'row';
        }
    }

    return [
        username,
        options.proxyType,
        country,
        'sid',
        options.session.toString(10),
    ].join('-');
}


function getSession(key: string | undefined): number | undefined {
    if (!key || key.length <= 0) {
        return;
    }

    const raw = key.match(/\d+/g);

    if (raw === null) {
        return;
    }

    try {
        return parseInt(
            raw[ 0 ],
            10
        );
    } catch (err: any) {
        return;
    }
}


@Injectable()
export class TransportProxyNetnutService extends ATransportResidentialService {
    readonly type = TRANSPORT_NETNUT_TYPE;

    constructor(transportproviders: TransportprovidersService) {
        super();

        transportproviders.register(this);
    }

    completeProxyConfig(
        proxy: IConnectorProxyRefreshed, connector: IConnectorToRefresh
    ) {
        const
            connectorConfig = connector.connectorConfig as IConnectorNetnutConfig,
            credentialConfig = connector.credentialConfig as IConnectorNetnutCredential,
            proxyConfig = proxy.config as IProxyToConnectConfigResidential;

        proxyConfig.address = {
            hostname: 'gw.ntnt.io',
            port: 5959,
        };

        const session = getSession(proxy.key);

        if (!session) {
            throw new Error('Invalid session key');
        }

        proxyConfig.username = formatUsername(
            credentialConfig.username,
            {
                session,
                proxyType: connectorConfig.proxyType,
                country: connectorConfig.country.toLowerCase(),
            }
        );
        proxyConfig.password = credentialConfig.password;
    }

    protected override parseBodyError(
        r: IncomingMessage, callback: (err: Error) => void
    ) {
        const squidError = r.headers[ 'x-squid-error' ] as string;

        if (squidError && squidError.length >= 0) {
            callback(new Error(squidError));

            return;
        }

        super.parseBodyError(
            r,
            callback
        );
    }
}
