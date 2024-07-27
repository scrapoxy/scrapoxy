import {
    ClientRequest,
    createServer as createServerHttp,
    IncomingMessage,
    request,
    Server,
    ServerResponse,
} from 'http';
import { createServer as createServerHttps } from 'https';
import { Socket } from 'net';
import { PassThrough } from 'stream';
import {
    Inject,
    Injectable,
    Logger,
} from '@nestjs/common';
import {
    convertToConnectMode,
    EConnectMode,
    EProjectStatus,
    SCRAPOXY_COOKIE_PREFIX,
    SCRAPOXY_HEADER_PREFIX,
    SCRAPOXY_HEADER_PREFIX_LC,
} from '@scrapoxy/common';
import {
    parseConnectUrl,
    parseError,
    sanitizeHeadersValue,
    Sockets,
} from '@scrapoxy/proxy-sdk';
import { MASTER_MODULE_CONFIG } from './master.constants';
import {
    getProxynameFromHeaders,
    SocketConnect,
    TLSSocketMITM,
    writeSocketHeaders,
} from './master.helpers';
import { ConnectionMetrics } from './metrics';
import {
    CommanderMasterClientService,
    CommanderRefreshClientService,
} from '../commander-client';
import {
    parseBasicFromAuthorizationHeader,
    parseDomain,
    removeHeadersWithPrefix,
    sanitizeHeaders,
    SocketsDebug,
    urlToUrlOptions,
} from '../helpers';
import {
    HttpTransportError,
    TransportprovidersService,
} from '../transports';
import type { IMasterModuleConfig } from './master.module';
import type { ATransportService } from '../transports';
import type {
    OnModuleDestroy,
    OnModuleInit,
} from '@nestjs/common';
import type {
    IProjectToConnect,
    IProxyMetricsAdd,
    IProxyToConnect,
} from '@scrapoxy/common';
import type { ISockets } from '@scrapoxy/proxy-sdk';
import type {
    ClientRequestArgs,
    OutgoingHttpHeaders,
} from 'http';
import type { AddressInfo } from 'net';


// eslint-disable-next-line @typescript-eslint/no-require-imports,@typescript-eslint/no-var-requires
const { _connectionListener: connectionListener } = require('node:_http_server');


@Injectable()
export class MasterService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(MasterService.name);

    private readonly server: Server;

    private readonly sockets: Sockets | undefined;

    private readonly metricsProxies = new Map<string, IProxyMetricsAdd>();

    private metricsInterval: NodeJS.Timeout | undefined = void 0;

    constructor(
        private readonly commanderConnect: CommanderMasterClientService,
        private readonly commanderRefresh: CommanderRefreshClientService,
        @Inject(MASTER_MODULE_CONFIG)
        private readonly config: IMasterModuleConfig,
        private readonly transportproviders: TransportprovidersService
    ) {
        this.sockets = config.trackSockets ? new Sockets() : void 0;

        if (config.certificate) {
            this.server = createServerHttps(config.certificate);
        } else {
            this.server = createServerHttp();
        }
        this.server.on(
            'request',
            (
                req, res
            ) => {
                (async() => this.request(
                    req,
                    res
                ))()
                    .catch((err: any)=>{
                        this.logger.error(err);
                    });
            }
        );
        this.server.on(
            'connect',
            (
                req: IncomingMessage, socket: SocketConnect
            ) => {
                (async() => this.connect(
                    req,
                    socket
                ))()
                    .catch((err: any)=>{
                        this.logger.error(err);
                    });
            }
        );
    }

    async onModuleInit() {
        // Save cached metrics every second
        this.metricsInterval = setInterval(
            () => {
                (async() => {
                    if (this.metricsProxies.size > 0) {
                        const metrics = Array
                            .from(this.metricsProxies.values())
                            .filter((m) =>
                                m.requests > 0 ||
                                m.bytesReceived > 0 ||
                                m.bytesSent > 0);

                        this.metricsProxies.clear();

                        await this.commanderRefresh.addProxiesMetrics(metrics);
                    }
                })()
                    .catch((err: any)=>{
                        this.logger.error(err);
                    });
            },
            this.config.refreshMetrics.delay
        );

        // Listen
        const port = await this.listen();
        this.logger.log(`Master is listening at port ${port}`);
    }

    async onModuleDestroy() {
        if (this.metricsInterval) {
            clearInterval(this.metricsInterval);

            this.metricsInterval = void 0;
        }

        await this.close();
    }

    get port(): number | null {
        const address = this.server.address() as AddressInfo;

        if (!address) {
            return null;
        }

        return address.port;
    }

    get socketsSize(): number {
        if (!this.sockets) {
            throw new Error('Sockets are not tracked');
        }

        return this.sockets.size;
    }

    private async request(
        req: IncomingMessage, res: ServerResponse
    ): Promise<void> {
        let proxyReq: ClientRequest | undefined = void 0;
        req.on(
            'error',
            (err: any) => {
                err = parseError(err);

                this.logger.error(
                    `request_error: ${err.message} from client (${req.method} ${req.url})`,
                    err.stack
                );

                if (!proxyReq || proxyReq.closed || proxyReq.destroyed) {
                    return;
                }

                proxyReq.end();
            }
        );

        req.on(
            'aborted',
            () => {
                this.logger.error(`request_error: aborted from client (${req.method} ${req.url})`);

                if (!proxyReq || proxyReq.closed || proxyReq.destroyed) {
                    return;
                }

                if (
                    proxyReq.socket?.closed &&
                    !proxyReq.socket.destroyed
                ) {
                    proxyReq.socket.end();
                }

                proxyReq.end();
            }
        );

        res.on(
            'error',
            (err: any) => {
                err = parseError(err);

                this.logger.error(
                    `response_error: ${err.message} from client (${req.method} ${req.url})`,
                    err.stack
                );
            }
        );

        const sockets = this.config.trackSockets ? new SocketsDebug(this.sockets) : new Sockets(this.sockets);
        res.on(
            'close',
            () => {
                sockets.closeAll();
            }
        );

        if (!req.url || req.url.length <= 0) {
            this.endResponseWithError(
                req,
                res,
                400,
                'wrong_url',
                'URL is empty'
            );

            return;
        }

        // Find project
        let project: IProjectToConnect;

        if (req.url.startsWith('/')) {
            const socket = req.socket as TLSSocketMITM;

            if (!socket.initialRequest) {
                this.endResponseWithError(
                    req,
                    res,
                    400,
                    'wrong_url',
                    'URL has no hostname'
                );

                return;
            }

            project = socket.project;

            if (socket.port === 443) {
                req.url = `https://${socket.hostname}${req.url}`;
            } else {
                req.url = `https://${socket.hostname}:${socket.port}${req.url}`;
            }
        } else {
            try {
                const token = parseBasicFromAuthorizationHeader(req.headers[ 'proxy-authorization' ]);

                if (!token) {
                    this.endResponseWithError(
                        req,
                        res,
                        407,
                        'no_token',
                        'No token found'
                    );

                    return;
                }

                project = await this.commanderConnect.getProjectToConnect(
                    token,
                    EConnectMode.TUNNEL,
                    null
                );
            } catch (err: any) {
                this.endResponseWithError(
                    req,
                    res,
                    407,
                    'no_project',
                    err.message
                );

                return;
            }
        }

        // Find proxy
        const proxyname = getProxynameFromHeaders(req.headers);
        let proxy: IProxyToConnect;
        try {
            proxy = await this.commanderConnect.getNextProxyToConnect(
                project.id,
                proxyname
            );
        } catch (err: any) {
            this.endResponseWithError(
                req,
                res,
                557,
                'no_proxy',
                err.message
            );

            return;
        }

        // Scale up proxy if auto-scale is enabled
        if (project.autoScaleUp && project.status === EProjectStatus.CALM) {
            try {
                await this.commanderConnect.scaleUpProject(project.id);
            } catch (err: any) {
                this.endResponseWithError(
                    req,
                    res,
                    557,
                    'cannot_scaleup',
                    `Cannot change project status: ${err.message}`
                );

                return;
            }
        }

        // Build request
        let reqArgs: ClientRequestArgs,
            transport: ATransportService;
        try {
            transport = this.transportproviders.getTransportByType(proxy.transportType);

            const urlOpts = urlToUrlOptions(req.url as string);

            if (!urlOpts) {
                throw new Error('Cannot parse req.url');
            }

            reqArgs = transport.buildRequestArgs(
                req.method,
                urlOpts,
                req.headers,
                {
                    Host: `${urlOpts.hostname}:${urlOpts.port}`,
                },
                proxy,
                sockets
            );

            reqArgs.headers = reqArgs.headers ?? {};
        } catch (err: any) {
            this.endResponseWithError(
                req,
                res,
                500,
                'build_request',
                err.message
            );

            return;
        }

        const sIn = new PassThrough(),
            sOut = new PassThrough();
        // Attach metrics for this connection
        const metrics = new ConnectionMetrics(
            proxy,
            this.metricsProxies,
            sIn,
            sOut
        );

        // Set user-agent
        if (project.useragentOverride) {
            reqArgs.headers[ 'user-agent' ] = proxy.useragent;
        }

        // Clean proxy & scrapoxy headers
        delete reqArgs.headers[ 'proxy-authorization' ];

        removeHeadersWithPrefix(
            reqArgs.headers,
            SCRAPOXY_HEADER_PREFIX_LC
        );

        // Start request
        metrics.addRequestHeaders(reqArgs);

        proxyReq = request(reqArgs);

        proxyReq.on(
            'error',
            (err: any) => {
                err = parseError(err);

                this.endResponseWithError(
                    req,
                    res,
                    500,
                    'request_error',
                    err.message,
                    proxy
                );
            }
        );

        proxyReq.on(
            'response',
            (proxyRes: IncomingMessage) => {
                metrics.addResponseHeaders(proxyRes);

                proxyRes.on(
                    'error',
                    (err: any) => {
                        err = parseError(err);

                        this.endResponseWithError(
                            req,
                            res,
                            500,
                            'response_error',
                            err.message,
                            proxy
                        );
                    }
                );

                proxyRes.on(
                    'close',
                    () => {
                        metrics.unregister();
                    }
                );

                /*
                // Keep this comment:
                // Don't force close connection on client side where server closed it
                // because client won't have time to parse the response
                // and it will be considered as an aborted connection.
                proxyRes.on(
                    'end',
                    () => {
                        res.end();
                    }
                );
                 */

                const proxyResHeaders = sanitizeHeaders(proxyRes.headers);

                // Add proxy headers and cookies
                proxyResHeaders[ `${SCRAPOXY_HEADER_PREFIX}-Proxyname` ] = proxy.id;

                const hostHeader = proxyReq!.getHeader('host') as (string | undefined);
                const domain = parseDomain(hostHeader);

                if (domain) {
                    if (project.cookieSession) {
                        proxyResHeaders[ 'set-cookie' ] = proxyResHeaders[ 'set-cookie' ] ?? [];

                        const setCookieHeader = proxyResHeaders[ 'set-cookie' ] as string[];

                        if (req.url?.startsWith('https:')) {
                            setCookieHeader.push(`${SCRAPOXY_COOKIE_PREFIX}-proxyname=${proxy.id}; Domain=.${domain}; HttpOnly; Secure; SameSite=None`);
                            setCookieHeader.push(`${SCRAPOXY_COOKIE_PREFIX}-proxyname=${proxy.id}; HttpOnly; Secure; SameSite=None`);
                        } else {
                            setCookieHeader.push(`${SCRAPOXY_COOKIE_PREFIX}-proxyname=${proxy.id}; Domain=.${domain}; HttpOnly`);
                            setCookieHeader.push(`${SCRAPOXY_COOKIE_PREFIX}-proxyname=${proxy.id}; HttpOnly`);
                        }
                    } else if (proxyname) {
                        proxyResHeaders[ 'set-cookie' ] = proxyResHeaders[ 'set-cookie' ] ?? [];

                        const setCookieHeader = proxyResHeaders[ 'set-cookie' ] as string[];

                        if (req.url?.startsWith('https:')) {
                            setCookieHeader.push(`${SCRAPOXY_COOKIE_PREFIX}-proxyname=; Domain=.${domain}; HttpOnly; Secure; SameSite=None; expires=Thu, 01 Jan 1970 00:00:00 GMT`);
                            setCookieHeader.push(`${SCRAPOXY_COOKIE_PREFIX}-proxyname=; HttpOnly; Secure; SameSite=None; expires=Thu, 01 Jan 1970 00:00:00 GMT`);
                        } else {
                            setCookieHeader.push(`${SCRAPOXY_COOKIE_PREFIX}-proxyname=; Domain=.${domain}; HttpOnly; expires=Thu, 01 Jan 1970 00:00:00 GMT`);
                            setCookieHeader.push(`${SCRAPOXY_COOKIE_PREFIX}-proxyname=; HttpOnly; expires=Thu, 01 Jan 1970 00:00:00 GMT`);
                        }
                    }
                }

                res.writeHead(
                    proxyRes.statusCode as number,
                    proxyRes.statusMessage,
                    proxyResHeaders
                );

                proxyRes
                    .pipe(sIn)
                    .pipe(res);
            }
        );

        req
            .pipe(sOut)
            .pipe(proxyReq);
    }

    private async connect(
        req: IncomingMessage, socket: SocketConnect
    ): Promise<void> {
        socket.on(
            'error',
            (err: any) => {
                err = parseError(err);

                this.logger.error(
                    `socket_error: ${err.message} from client (${req.method} ${req.url})`,
                    err.stack
                );
            }
        );

        const sockets = this.config.trackSockets ? new SocketsDebug(this.sockets) : new Sockets(this.sockets);
        socket.on(
            'close',
            () => {
                sockets.closeAll();
            }
        );

        sockets.add(
            socket,
            'MasterService:connect:socket'
        );

        // Find project
        let project: IProjectToConnect;
        try {
            const token = parseBasicFromAuthorizationHeader(req.headers[ 'proxy-authorization' ]);

            if (!token) {
                this.endSocketWithError(
                    req,
                    socket,
                    407,
                    'no_token',
                    'No token found'
                );

                return;
            }

            const { hostname, port } = parseConnectUrl(req.url);
            socket.hostname = hostname;
            socket.port = port;

            project = await this.commanderConnect.getProjectToConnect(
                token,
                convertToConnectMode(req.headers[ `${SCRAPOXY_HEADER_PREFIX_LC}-mode` ]),
                hostname
            );
        } catch (err: any) {
            this.endSocketWithError(
                req,
                socket,
                407,
                'no_project',
                err.message
            );

            return;
        }

        if (project.certificate) {
            await this.connectMITM(
                req,
                socket,
                project,
                sockets
            );
        } else {
            await this.connectTunnel(
                req,
                socket,
                project,
                sockets
            );
        }
    }

    private async connectMITM(
        req: IncomingMessage,
        socket: SocketConnect,
        project: IProjectToConnect,
        sockets: ISockets
    ): Promise<void> {
        const tlsSocket = new TLSSocketMITM(
            socket,
            req,
            project,
            {
                ...project.certificate,
                isServer: true,
                requestCert: true,
                rejectUnauthorized: false,
            }
        );
        tlsSocket.on(
            'error',
            (err: any) => {
                err = parseError(err);

                this.logger.error(
                    `tls_socket_error: ${err.message} from client (${req.method} ${req.url})`,
                    err.stack
                );
            }
        );

        tlsSocket.on(
            'close',
            () => {
                sockets.remove(tlsSocket);

                socket.end();
            }
        );
        sockets.add(
            tlsSocket,
            'MasterService:connect:tlsSocket'
        );

        socket.on(
            'close',
            () => {
                tlsSocket.end();
            }
        );

        const listener = connectionListener.bind(this.server);
        listener(tlsSocket);

        socket.write('HTTP/1.1 200 Connection established\r\n\r\n');
    }

    private async connectTunnel(
        req: IncomingMessage,
        socket: SocketConnect,
        project: IProjectToConnect,
        sockets: ISockets
    ): Promise<void> {
        let proxySocket: Socket | undefined = void 0;
        req.on(
            'error',
            (err: any) => {
                err = parseError(err);

                this.logger.error(
                    `request_error: ${err.message} from client (${req.method} ${req.url})`,
                    err.stack
                );

                if (!proxySocket || proxySocket.closed || proxySocket.destroyed) {
                    return;
                }

                proxySocket.end();
            }
        );

        req.on(
            'aborted',
            () => {
                this.logger.error(`request_error: aborted from client (${req.method} ${req.url})`);

                if (!proxySocket || proxySocket.closed || proxySocket.destroyed) {
                    return;
                }

                proxySocket.end();
            }
        );

        // Find proxy
        let proxy: IProxyToConnect;

        try {
            proxy = await this.commanderConnect.getNextProxyToConnect(
                project.id,
                getProxynameFromHeaders(req.headers)
            );
        } catch (err: any) {
            this.endSocketWithError(
                req,
                socket,
                557,
                'no_proxy',
                err.message
            );

            return;
        }

        socket.on(
            'timeout',
            () => {
                socket.destroy();
                socket.emit('close');
            }
        );
        socket.setTimeout(proxy.timeoutDisconnected);

        const sIn = new PassThrough(),
            sOut = new PassThrough();
        // Attach metrics for this connection
        const metrics = new ConnectionMetrics(
            proxy,
            this.metricsProxies,
            sIn,
            sOut
        );
        let transport: ATransportService;
        try {
            transport = this.transportproviders.getTransportByType(proxy.transportType);

            // Start request
            transport.connect(
                req.url as string,
                {
                    Host: `${socket.hostname}:${socket.port}`,
                },
                proxy,
                sockets,
                (
                    err, pSocket
                ) => {
                    if (err) {
                        err = parseError(err);

                        let
                            message: string,
                            statusCode: number;

                        if (err instanceof HttpTransportError) {
                            const errHttp = err as HttpTransportError;
                            statusCode = errHttp.statusCode ?? 500;
                            message = errHttp.message;
                        } else {
                            statusCode = 500;
                            message = err.message;
                        }

                        this.endSocketWithError(
                            req,
                            socket,
                            statusCode,
                            'build_connect',
                            message,
                            proxy
                        );

                        return;
                    }

                    proxySocket = pSocket;

                    proxySocket.on(
                        'error',
                        (errSocket: any) => {
                            errSocket = parseError(errSocket);

                            this.endSocketWithError(
                                req,
                                socket,
                                500,
                                'socket_error',
                                errSocket.message,
                                proxy
                            );
                        }
                    );

                    proxySocket.on(
                        'end',
                        () => {
                            socket.end();
                        }
                    );

                    proxySocket.on(
                        'close',
                        () => {
                            metrics.unregister();
                        }
                    );

                    const proxySocketHeaders: OutgoingHttpHeaders = {};

                    // Add proxy headers
                    proxySocketHeaders[ `${SCRAPOXY_HEADER_PREFIX}-Proxyname` ] = proxy.id;

                    writeSocketHeaders(
                        socket,
                        proxySocketHeaders
                    )
                        .then(() => {
                            proxySocket!
                                .pipe(sIn)
                                .pipe(socket);
                            socket
                                .pipe(sOut)
                                .pipe(proxySocket!);
                        })
                        .catch((errSocket: any) => {
                            this.endSocketWithError(
                                req,
                                socket,
                                500,
                                'write_error',
                                errSocket.message,
                                proxy
                            );
                        });
                }
            );
        } catch (err: any) {
            this.endSocketWithError(
                req,
                socket,
                500,
                'build_connect',
                err.message,
                proxy
            );

            return;
        }
    }

    private listen(): Promise<number> {
        return new Promise<number>((
            resolve, reject
        ) => {
            this.server.on(
                'error',
                (err: any) => {
                    err = parseError(err);

                    reject(new Error(`Cannot listen at port ${this.config.port}: ${err.message}`));
                }
            );

            this.server.on(
                'listening',
                () => {
                    resolve(this.port as number);
                }
            );

            this.server.listen(this.config.port);
        });
    }

    private close(): Promise<void> {
        this.logger.log('Shutdown master');

        return new Promise<void>((
            resolve, reject
        ) => {
            if (this.sockets) {
                this.sockets.closeAll();
            }

            this.server.close((err: any) => {
                if (err && err.code !== 'ERR_SERVER_NOT_RUNNING') {
                    reject(err);

                    return;
                }

                resolve();
            });
        });
    }

    private endResponseWithError(
        req: IncomingMessage,
        res: ServerResponse,
        statusCode: number,
        id: string,
        message: string,
        proxy?: IProxyToConnect
    ) {
        message = sanitizeHeadersValue(message) as string;

        const headers: { [key: string]: string } = {
            'Content-Type': 'application/json',
        };

        headers[ `${SCRAPOXY_HEADER_PREFIX}-Proxyerror` ] = message;

        if (statusCode === 407) {
            headers[ 'Proxy-Authenticate' ] = 'Basic';
        }

        const data: any = {
            id,
            message,
            method: req.method,
            url: req.url,
        };

        if (proxy) {
            this.logger.error(`${id}: ${message} from proxy ${proxy.id} (${req.method} ${req.url})`);

            headers[ `${SCRAPOXY_HEADER_PREFIX}-Proxyname` ] = proxy.id;

            data.proxyId = proxy.id;
        } else {
            this.logger.error(`${id}: ${message} (${req.method} ${req.url})`);
        }

        try {
            res.writeHead(
                statusCode,
                id,
                headers
            );
        } catch (err: any) {
            // Error is: Cannot write headers after they are sent to the client
            // Ignore because it happens when client aborts connection
        }

        res.end(JSON.stringify(data));
    }

    private endSocketWithError(
        req: IncomingMessage,
        socket: Socket,
        statusCode: number,
        id: string,
        message: string,
        proxy?: IProxyToConnect
    ) {
        message = sanitizeHeadersValue(message) as string;

        const lines = [
            `HTTP/1.1 ${statusCode} ${id}`, `${SCRAPOXY_HEADER_PREFIX}-Proxyerror: ${message}`,
        ];

        if (statusCode === 407) {
            lines.push('Proxy-Authenticate: Basic');
        }

        if (proxy) {
            this.logger.error(`${id}: ${message} from proxy ${proxy.id} (${req.method} ${req.url})`);
            lines.push(`${SCRAPOXY_HEADER_PREFIX}-Proxyname: ${proxy.id}`);
        } else {
            this.logger.error(`${id}: ${message} (${req.method} ${req.url})`);
        }

        socket.end(`${lines.join('\r\n')}\r\n\r\n`);
    }
}
