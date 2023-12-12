import { IncomingMessage } from 'http';
import { Socket } from 'net';
import { TLSSocket } from 'tls';
import {
    SCRAPOXY_COOKIE_PREFIX,
    SCRAPOXY_HEADER_PREFIX_LC,
} from '@scrapoxy/common';
import { socketWriteAsync } from '@scrapoxy/proxy-sdk';
import type { IProjectToConnect } from '@scrapoxy/common';
import type {
    IncomingHttpHeaders,
    OutgoingHttpHeaders,
} from 'http';
import type { TLSSocketOptions } from 'tls';


const SCRAPOXY_COOKIE_REGEX = new RegExp(
    `${SCRAPOXY_COOKIE_PREFIX}-proxyname=([^;]+);{0,1}\s*`,
    'i'
);


function getProxynameFromCookieHeaders(headers: IncomingHttpHeaders): string | null {
    const cookieHeader = headers.cookie;

    if (!cookieHeader || cookieHeader.length <= 0) {
        return null;
    }

    const arr = SCRAPOXY_COOKIE_REGEX.exec(cookieHeader);

    if (!arr || arr.length <= 0) {
        return null;
    }

    const proxyname = arr[ 1 ];

    headers.cookie = cookieHeader.replace(
        SCRAPOXY_COOKIE_REGEX,
        ''
    );

    return proxyname;
}


export function getProxynameFromHeaders(headers: IncomingHttpHeaders): string | null {
    const proxynameFromHeader = headers[ `${SCRAPOXY_HEADER_PREFIX_LC}-proxyname` ] as string;

    if (proxynameFromHeader && proxynameFromHeader.length > 0) {
        return proxynameFromHeader;
    }

    return getProxynameFromCookieHeaders(headers);
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
