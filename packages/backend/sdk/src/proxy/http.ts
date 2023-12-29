import {
    ClientRequest,
    createServer as createServerHttp,
    IncomingMessage,
    request,
    Server,
    ServerResponse,
} from 'http';
import { createServer as createServerHttps } from 'https';
import {
    createConnection,
    Socket,
} from 'net';
import {
    parseConnectUrl,
    parseError,
    Sockets,
} from '@scrapoxy/proxy-sdk';
import {
    createConnectionAuto,
    generateCertificateSelfSignedForTest,
    urlOptionsToUrl,
    urlToUrlOptions,
} from '../helpers';
import type { LoggerService } from '@nestjs/common';
import type { ClientRequestArgs } from 'http';
import type { AddressInfo } from 'net';


abstract class AProxy {
    protected server: Server | undefined;

    private readonly sockets = new Sockets();

    private listenPromise?: Promise<number>;

    private closePromise?: Promise<void>;

    constructor(
        private readonly logger: LoggerService,
        private readonly timeout: number
    ) {}

    get port(): number | null {
        if (!this.server) {
            throw new Error('Server has not been initialized');
        }

        const address: AddressInfo = this.server.address() as AddressInfo;

        if (!address) {
            return null;
        }

        return address.port;
    }

    get url(): string {
        return `http://localhost:${this.port}`;
    }

    listen(port = 0): Promise<number> {
        if (!this.server) {
            throw new Error('Server has not been initialized');
        }

        this.server.on(
            'request',
            (
                req: IncomingMessage, res: ServerResponse
            ) => {
                this.request(
                    req,
                    res
                );
            }
        );

        this.server.on(
            'connect',
            (
                req: IncomingMessage, socket: Socket, head: Buffer
            ) => {
                this.connect(
                    req,
                    socket,
                    head
                );
            }
        );

        if (this.closePromise) {
            throw new Error('Server has already been stopped');
        }

        if (this.listenPromise) {
            return this.listenPromise;
        }

        this.listenPromise = new Promise<number>((
            resolve, reject
        ) => {
            this.server!.on(
                'error',
                (err: any) => {
                    reject(new Error(`Proxy cannot listen at port ${port} : ${err.message}`));
                }
            );

            this.server!.on(
                'listening',
                () => {
                    this.logger.debug?.(`[ProxyHttp] listen at ${this.port}`);

                    resolve(this.port as number);

                }
            );

            this.server!.listen(port);
        });

        return this.listenPromise;
    }

    close(): Promise<void> {
        if (this.closePromise) {
            return this.closePromise;
        }

        if (this.listenPromise) {
            this.closePromise = new Promise<void>((
                resolve, reject
            ) => {
                this.sockets.closeAll();

                this.server!.close((err: Error | undefined) => {
                    if (err) {
                        reject(err);

                        return;
                    }

                    resolve();
                });
            });
        } else {
            this.closePromise = Promise.resolve();
        }

        return this.closePromise;
    }

    protected request(
        req: IncomingMessage, res: ServerResponse
    ) {
        this.logger.debug?.(`[ProxyHttp] request ${req.method} ${req.url}`);

        req.on(
            'error',
            (err: any) => {
                err = parseError(err);

                this.logger.error(
                    `request_error: ${err.message} from client (${req.method} ${req.url})`,
                    err.stack
                );
            }
        );

        const urlOpts = urlToUrlOptions(req.url);

        if (!urlOpts) {
            res.statusCode = 400;
            res.end('Invalid URL');

            return;
        }

        const path = urlOptionsToUrl(
            urlOpts,
            false
        );
        let proxyReq: ClientRequest;
        const args: ClientRequestArgs = {
            method: req.method,
            hostname: urlOpts.hostname,
            port: urlOpts.port,
            path,
            headers: req.headers,
            timeout: this.timeout,
            createConnection: (
                opts,
                oncreate
            ): Socket => createConnectionAuto(
                opts,
                oncreate,
                this.sockets,
                'ProxyHttp:request',
                urlOpts.protocol === 'https:' ? {} : void 0
            ),
        };

        // eslint-disable-next-line prefer-const
        proxyReq = request(
            args,
            (proxyRes: IncomingMessage) => {
                res.writeHead(
                    proxyRes.statusCode as number,
                    proxyRes.headers
                );
                proxyRes.pipe(res);
            }
        );

        proxyReq.on(
            'error',
            (err: any) => {
                err = parseError(err);

                res.statusCode = 500;
                res.end(err.message);
            }
        );

        req.pipe(proxyReq);
    }

    protected connect(
        // eslint-disable-next-line unused-imports/no-unused-vars
        req: IncomingMessage, socket: Socket, head: Buffer
    ) {
        this.logger.debug?.(`[ProxyHttp] connect ${req.method} ${req.url}`);

        req.on(
            'error',
            (err: any) => {
                err = parseError(err);

                this.logger.error(
                    `connect_error (req): ${err.message} from client (${req.method} ${req.url})`,
                    err.stack
                );
            }
        );

        let proxySocket: Socket | undefined = void 0;
        socket.on(
            'error',
            (err: any) => {
                err = parseError(err);

                this.logger.error(
                    `connect_error (socket): ${err.message} from client (${req.method} ${req.url})`,
                    err.stack
                );

                if (!proxySocket || proxySocket.closed || proxySocket.destroyed) {
                    return;
                }

                proxySocket.end();
            }
        );

        socket.on(
            'close',
            () => {
                this.sockets.remove(socket);
            }
        );
        this.sockets.add(socket);

        let
            hostname: string,
            port: number;
        try {
            const urlOpts = parseConnectUrl(req.url);
            hostname = urlOpts.hostname;
            port = urlOpts.port;
        } catch (err: any) {
            socket.end();

            return;
        }

        proxySocket = createConnection({
            host: hostname,
            port,
            timeout: this.timeout,
        });

        proxySocket.on(
            'error',
            (err: any) => {
                if (socket.closed || socket.destroyed) {
                    return;
                }

                err = parseError(err);

                socket.write(`HTTP/1.1 500 Connection error: ${err.message}\r\n\r\n`);
                socket.end();
            }
        );

        proxySocket.on(
            'close',
            () => {
                this.sockets.remove(proxySocket as Socket);
            }
        );
        this.sockets.add(proxySocket);

        proxySocket.on(
            'timeout',
            () => {
                const pSocket = proxySocket as Socket;
                pSocket.destroy();
                pSocket.emit('close');
            }
        );

        proxySocket.on(
            'end',
            () => {
                socket.end();
            }
        );

        proxySocket.on(
            'connect',
            () => {
                const pSocket = proxySocket as Socket;
                socket.write('HTTP/1.1 200 OK\r\n\r\n');
                pSocket.pipe(socket);
            }
        );

        socket.pipe(proxySocket);
    }
}


export class ProxyHttp extends AProxy {
    constructor(
        logger: LoggerService,
        timeout: number
    ) {
        super(
            logger,
            timeout
        );

        this.server = createServerHttp();
    }
}


export class ProxyHttps extends AProxy {
    constructor(
        logger: LoggerService,
        timeout: number
    ) {
        super(
            logger,
            timeout
        );

        const certificate = generateCertificateSelfSignedForTest();

        this.server = createServerHttps({
            cert: certificate.cert,
            key: certificate.key,
        });
    }
}
