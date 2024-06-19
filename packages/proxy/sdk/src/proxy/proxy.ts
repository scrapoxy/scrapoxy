import {
    IncomingMessage,
    ServerResponse,
} from 'http';
import {
    createServer,
    Server,
} from 'https';
import {
    createConnection,
    Socket,
} from 'net';
import {
    parseConnectUrl,
    parseError,
    sanitizeHeadersValue,
    Sockets,
    socketWriteAsync,
} from '../helpers';
import {
    SCRAPOXY_PROXY_HEADER_PREFIX,
    SCRAPOXY_PROXY_HEADER_PREFIX_LC,
} from '../info';
import type {
    IProxy,
    IProxyLogger,
} from './proxy.interface';
import type { AddressInfo } from 'net';


export class Proxy implements IProxy {
    private readonly server: Server;

    private readonly sockets = new Sockets();

    private connectsCountValue = 0;

    private listenPromise?: Promise<number>;

    private closePromise?: Promise<void>;

    get connectsCount() {
        return this.connectsCountValue;
    }

    constructor(
        private readonly logger: IProxyLogger,
        private readonly timeout: number,
        cert: string,
        key: string
    ) {

        this.server = createServer({
            requestCert: true,
            rejectUnauthorized: false,
            ca: cert,
            cert: cert,
            key: key,
        });
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
        this.server.on(
            'request',
            (
                req: IncomingMessage, res: ServerResponse
            ) => {
                res.statusCode = 404;
                res.end();
            }
        );
    }

    get port(): number | null {
        const address: AddressInfo = this.server.address() as AddressInfo;

        if (!address) {
            return null;
        }

        return address.port;
    }

    listen(port = 0): Promise<number> {
        if (this.closePromise) {
            throw new Error('Server has already been stopped');
        }

        if (this.listenPromise) {
            return this.listenPromise;
        }

        this.listenPromise = new Promise<number>((
            resolve, reject
        ) => {
            this.server.on(
                'listening',
                () => {
                    this.logger.log(`Proxy listen at ${this.port}`);

                    resolve(this.port as number);
                }
            );

            this.server.on(
                'error',
                (err: any) => {
                    err = parseError(err);

                    reject(new Error(`Proxy cannot listen at port ${port} : ${err.message}`));
                }
            );

            this.server.listen(port);
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

                this.server.close((err: Error | undefined) => {
                    if (err) {
                        reject(err);

                        return;
                    }

                    this.logger.log('Proxy shutdown');

                    resolve();
                });
            });
        } else {
            this.closePromise = Promise.resolve();
        }

        return this.closePromise;
    }

    private connect(
        req: IncomingMessage, socket: Socket, head: Buffer
    ) {
        let
            headerWritten = false,
            hostname: string,
            port: number,
            proxySocket: Socket | undefined = void 0;

        socket.on(
            'error',
            (err: any) => {
                err = parseError(err);

                this.logger.error(
                    `Error (socket): ${err.message} (${hostname}:${port})`,
                    err.stack
                );

                if (!proxySocket || proxySocket.closed || proxySocket.destroyed) {
                    return;
                }

                proxySocket.end();
            }
        );

        socket.on(
            'end',
            () => {
                if (!proxySocket || proxySocket.closed || proxySocket.destroyed) {
                    return;
                }

                proxySocket.unpipe(socket);
                proxySocket.end();
            }
        );

        socket.on(
            'close',
            () => {
                this.sockets.remove(socket);
            }
        );

        if (req.headers[ `${SCRAPOXY_PROXY_HEADER_PREFIX_LC}-metrics` ] !== 'ignore') {
            ++this.connectsCountValue;
        }

        if (!(socket as any).authorized) {
            socket.end(`HTTP/1.1 401 connect_error\r\n${SCRAPOXY_PROXY_HEADER_PREFIX}-Proxyerror: invalid certificate\r\n\r\n\r\n`);

            return;
        }

        try {
            const urlOpts = parseConnectUrl(req.url);
            hostname = urlOpts.hostname;
            port = urlOpts.port;

            proxySocket = createConnection({
                host: hostname,
                port,
            });

            proxySocket.on(
                'error',
                (err: any) => {
                    err = parseError(err);

                    this.logger.error(
                        `Error (proxySocket): ${err.message} (${hostname}:${port})`,
                        err.stack
                    );

                    if (socket.closed || socket.destroyed) {
                        return;
                    }

                    if (!headerWritten) {
                        const errMessage = sanitizeHeadersValue(err.message);
                        socket.end(`HTTP/1.1 500 connect_error\r\n${SCRAPOXY_PROXY_HEADER_PREFIX}-Proxyerror: ${errMessage}\r\n\r\n\r\n`);
                    } else {
                        socket.end();
                    }
                }
            );

            proxySocket.on(
                'end',
                () => {
                    if (socket.closed || socket.destroyed) {
                        return;
                    }

                    socket.unpipe(proxySocket!);
                    socket.end();
                }
            );

            proxySocket.on(
                'close',
                () => {
                    this.sockets.remove(proxySocket!);
                }
            );
            this.sockets.add(proxySocket);

            proxySocket.on(
                'timeout',
                () => {
                    proxySocket!.destroy();
                    proxySocket!.emit('close');
                }
            );
            proxySocket.setTimeout(this.timeout);

            proxySocket.on(
                'connect',
                () => {
                    socketWriteAsync(
                        proxySocket!,
                        head
                    )
                        .then(() => socketWriteAsync(
                            socket,
                            'HTTP/1.1 200 OK\r\n\r\n'
                        ))
                        .then(() => {
                            headerWritten = true;

                            proxySocket!.pipe(socket);
                        })
                        .catch((err: any) => {
                            proxySocket!.emit(
                                'error',
                                err
                            );
                        });
                }
            );

            //const throttle = this.throttleGroup.throttle();

            socket.pipe(proxySocket);
        } catch (err: any) {
            this.logger.error(
                `Error (connect): ${err.message}`,
                err.stack
            );
        }
    }
}
