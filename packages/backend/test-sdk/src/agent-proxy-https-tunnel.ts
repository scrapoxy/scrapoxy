import { EventEmitter } from 'events';
import {
    ClientRequest,
    IncomingMessage,
    request,
} from 'http';
import { Socket } from 'net';
import { connect } from 'tls';
import { isUrl } from '@scrapoxy/backend-sdk';
import { SCRAPOXY_HEADER_PREFIX_LC } from '@scrapoxy/common';
import { Sockets } from '@scrapoxy/proxy-sdk';
import type {
    IncomingHttpHeaders,
    OutgoingHttpHeaders,
    RequestOptions,
} from 'http';
import type { ConnectionOptions } from 'tls';


export interface IAgentProxyHttpsTunnelConfig {
    hostname: string;
    port: number;
    ca?: string;
    headers?: OutgoingHttpHeaders;
}


export class AgentProxyHttpsTunnel extends EventEmitter {
    public headers!: IncomingHttpHeaders;

    private readonly sockets = new Sockets();

    constructor(private readonly config: IAgentProxyHttpsTunnelConfig) {
        super();
    }

    addRequest(
        req: ClientRequest,
        opts: RequestOptions
    ) {
        const port = opts.protocol === 'https:' && opts.port == 80 ? 443 : opts.port;
        const proxyReqOptions: RequestOptions = {
            method: 'CONNECT',
            hostname: this.config.hostname,
            port: this.config.port,
            path: `${opts.host}:${port}`,
            headers: this.config.headers ?? {},
        };
        const proxyReq = request(proxyReqOptions);
        proxyReq.on(
            'error',
            (err: any) => {
                this.emit(
                    'error',
                    err
                );
            }
        );

        proxyReq.on(
            'connect',
            (
                proxyRes: IncomingMessage, socket: Socket
            ) => {
                socket.on(
                    'close',
                    () => {
                        this.sockets.remove(socket);
                    }
                );
                this.sockets.add(socket);

                this.headers = proxyRes.headers;

                if (proxyRes.statusCode !== 200) {
                    req.emit(
                        'error',
                        new Error(proxyRes.headers[ `${SCRAPOXY_HEADER_PREFIX_LC}-proxyerror` ] as string || proxyRes.statusMessage)
                    );

                    return;
                }

                const options: ConnectionOptions = {
                    socket,
                    requestCert: true,
                    rejectUnauthorized: !!this.config.ca,
                    ca: this.config.ca,
                };

                if (isUrl(opts.hostname)) {
                    options.servername = opts.hostname as string;
                }

                const cts = connect(options);

                req.onSocket(cts);
            }
        );

        proxyReq.end();
    }

    close() {
        this.sockets.closeAll();
    }
}
