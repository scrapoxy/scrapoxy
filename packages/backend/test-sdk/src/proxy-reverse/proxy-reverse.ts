import {
    createConnection,
    createServer,
    Server,
    Socket,
} from 'net';
import { Logger } from '@nestjs/common';
import {
    parseError,
    Sockets,
} from '@scrapoxy/proxy-sdk';
import type { AddressInfo } from 'net';


export class ProxyReverse {
    private readonly logger = new Logger(ProxyReverse.name);

    private readonly ports: number[] = [];

    private readonly server: Server;

    private readonly sockets = new Sockets();

    private listenPromise?: Promise<number>;

    private closePromise?: Promise<void>;

    private portsInd = 0;

    constructor() {
        this.server = createServer();
        this.server.on(
            'connection',
            (socket) => {
                this.connection(socket);
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

    addPort(port: number) {
        this.ports.push(port);
    }

    removePort(port: number) {
        const ind = this.ports.indexOf(port);

        if (ind >= 0) {
            this.ports.splice(
                ind,
                1
            );
        }
    }

    clearPort() {
        this.ports.length = 0;
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
                'error',
                (err: any) => {
                    reject(new Error(`Proxy cannot listen at port ${port} : ${err.message}`));
                }
            );

            this.server.on(
                'listening',
                () => {
                    this.logger.log(`Proxy listen at ${this.port}`);

                    resolve(this.port as number);
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

    private connection(socket: Socket) {
        const port = this.getNextTarget();
        let proxySocket: Socket | undefined = void 0;
        socket.on(
            'error',
            (err: any) => {
                err = parseError(err);

                this.logger.error(
                    `Error (socket): ${err.message} (localhost:${port})`,
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

        try {
            // Connect to target
            this.logger.debug(`Proxy connects to localhost:${port}`);

            proxySocket = createConnection({
                host: 'localhost',
                port,
            });
            proxySocket.on(
                'error',
                (err: any) => {
                    err = parseError(err);

                    this.logger.error(
                        `Error (proxySocket): ${err.message} (localhost:${port})`,
                        err.stack
                    );

                    socket.end();
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
                    this.sockets.remove(proxySocket as Socket);
                }
            );
            this.sockets.add(proxySocket);

            socket.pipe(proxySocket)
                .pipe(socket);
        } catch (err: any) {
            this.logger.error(
                `Error (connect): ${err.message}`,
                err.stack
            );
        }
    }

    private getNextTarget(): number {
        const port = this.ports[ this.portsInd ];

        ++this.portsInd;

        if (this.portsInd >= this.ports.length) {
            this.portsInd = 0;
        }

        return port;
    }
}
