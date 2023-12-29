import {
    EProxyType,
    PROXY_TYPE_KEYS,
} from '../proxies';
import type { IFreeproxyBase } from './freeproxy.interface';
import type { IProxyTransportAuth } from '../proxies';


export function formatFreeproxyId(
    connectorId: string, freeproxy: IFreeproxyBase
) {
    return `${connectorId}:${freeproxy.key}`;
}


export function parseFreeproxy(raw: string | undefined | null): IFreeproxyBase | undefined {
    if (!raw || raw.length <= 0) {
        return;
    }

    const protocolMatch = /^(.*):\/\//i.exec(raw);
    let
        rawWithoutProtocol: string,
        type: EProxyType | undefined;

    if (protocolMatch) {
        const protocolStr = protocolMatch[ 1 ];

        // Normalize SOCKS protocol
        if (protocolStr.startsWith('socks4')) {
            type = EProxyType.SOCKS4;
        } else if (protocolStr.startsWith('socks')) {
            type = EProxyType.SOCKS5;
        } else {
            if (!PROXY_TYPE_KEYS.includes(protocolStr)) {
                return;
            }
            type = protocolStr as EProxyType;
        }

        rawWithoutProtocol = raw.substring(protocolMatch[ 0 ].length);
    } else {
        type = EProxyType.HTTP;
        rawWithoutProtocol = raw;
    }

    const atSplit = rawWithoutProtocol.split('@');

    if (atSplit.length > 2) {
        return;
    }

    let auth: IProxyTransportAuth | null,
        hostStr: string;

    if (atSplit.length === 2) {
        const authStr = atSplit[ 0 ];
        hostStr = atSplit[ 1 ];

        const authStrInd = authStr.indexOf(':');

        if (authStrInd >= 0) {
            auth = {
                username: authStr.substring(
                    0,
                    authStrInd
                ),
                password: authStr.substring(authStrInd + 1),
            };
        } else {
            auth = {
                username: authStr,
                password: '',
            };
        }
    } else {
        hostStr = atSplit[ 0 ];
        auth = null;
    }

    const hostStrSplit = hostStr.split(':');

    if (hostStrSplit.length !== 2) {
        return;
    }

    const [
        hostname, portStr,
    ] = hostStrSplit;
    const port = parseInt(
        portStr,
        10
    );

    if (
        !port ||
            port < 1 ||
            port > 65535
    ) {
        return;
    }

    return {
        key: `${hostname}:${port}`,
        type,
        address: {
            hostname,
            port,
        },
        auth,
    };
}
