import { IncomingMessage } from 'http';
import { Socket } from 'net';
import { TLSSocket } from 'tls';
import { SCRAPOXY_HEADER_PREFIX_LC } from '@scrapoxy/common';
import { socketWriteAsync } from '@scrapoxy/proxy-sdk';
import {
    ArrayHttpHeaders,
    SCRAPOXY_COOKIE_REGEX,
} from '../helpers';
import type { IProjectToConnect } from '@scrapoxy/common';
import type { OutgoingHttpHeaders } from 'http';
import type { TLSSocketOptions } from 'tls';


function getProxynameFromCookieHeaders(headers: ArrayHttpHeaders): string | null {
    const arr = headers.getFirstHeaderWithRegexValue(
        'cookie',
        SCRAPOXY_COOKIE_REGEX
    );

    if (!arr || arr.length <= 0) {
        return null;
    }

    return arr[ 1 ];
}


export function getProxynameFromHeaders(headers: ArrayHttpHeaders): string | null {
    const proxynameFromHeader = headers.getFirstHeader(`${SCRAPOXY_HEADER_PREFIX_LC}-proxyname`);

    if (!proxynameFromHeader || proxynameFromHeader.length <= 0) {
        return getProxynameFromCookieHeaders(headers);
    }

    return proxynameFromHeader;
}


export function writeSocketHeaders(
    socket: Socket,
    headers: OutgoingHttpHeaders
): Promise<void> {
    const lines = [
        'HTTP/1.1 200 OK',
    ];
    for (const [
        key, val,
    ] of Object.entries(headers)) {
        if (Array.isArray(val)) {
            for (const item of val) {
                lines.push(`${key}: ${item}`);
            }
        } else {
            lines.push(`${key}: ${val}`);
        }
    }

    return socketWriteAsync(
        socket,
        `${lines.join('\r\n')}\r\n\r\n`
    );
}


export class SocketConnect extends Socket {
    hostname: string | undefined = void 0;

    port: number | undefined = void 0;
}


export class TLSSocketMITM extends TLSSocket {
    hostname: string | undefined;

    port: number | undefined;

    constructor(
        socket: SocketConnect,
        public initialRequest: IncomingMessage,
        public project: IProjectToConnect,
        options?: TLSSocketOptions
    ) {
        super(
            socket,
            options
        );

        this.hostname = socket.hostname;
        this.port = socket.port;
    }
}
