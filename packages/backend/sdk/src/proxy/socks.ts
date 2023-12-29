// Based on https://github.com/sequoiar/socks5 from sequoiar

import { lookup } from 'dns';
import { EventEmitter } from 'events';
import {
    createConnection,
    createServer,
    Server,
    Socket,
} from 'net';
import { Sockets } from '@scrapoxy/proxy-sdk';
import type { LoggerService } from '@nestjs/common';
import type { AddressInfo } from 'net';


/*
 * Authentication methods
 ************************
 * x'00' NO AUTHENTICATION REQUIRED
 * x'01' GSSAPI
 * x'02' USERNAME/PASSWORD
 * x'03' to X'7F' IANA ASSIGNED
 * x'80' to X'FE' RESERVED FOR PRIVATE METHODS
 * x'FF' NO ACCEPTABLE METHODS
 */
enum ESocksAuth {
    NoAuth = 0x00,
    GssApi = 0x01,
    UserPass = 0x02,
    None = 0xFF,
}


/*
 * Command
 * *******************
 * x'01' CONNECT
 * x'02' BIND
 * x'03' UDP ASSOCIATE
 */
enum ESocksRequestCmd {
    Connect = 0x01,
    Bind = 0x02,
    UdpAssociate = 0x03,
}


/*
 * ATYP address type of following address
 ****************************************
 * x'01' IP V4 address
 * x'03' Domain name
 * x'04' IP V6 address
 */
enum ESocksAtyp {
    IpV4 = 0x01,
    Dns = 0x03,
    IpV6 = 0x04,
}


export interface ISocksCredentials {
    username: string;
    password: string;
}


class SockSocket extends Socket {
    socksVersion = -1;

    socksAddress: string | undefined = void 0;

    socksPort = -1;

    socksUid: string | undefined = void 0;

    request: Buffer | undefined = void 0;
}


function readAddress(
    buffer: Buffer, offset: number
): string {
    switch (buffer[ offset ]) {
        case ESocksAtyp.IpV4: {
            return `${buffer[ offset + 1 ]}.${buffer[ offset + 2 ]}.${buffer[ offset + 3 ]}.${buffer[ offset + 4 ]}`;
        }

        case ESocksAtyp.Dns: {
            return buffer.toString(
                'utf8',
                offset + 2,
                offset + 2 + buffer[ offset + 1 ]
            );
        }

        case ESocksAtyp.IpV6: {
            return buffer.subarray(
                buffer[ offset + 1 ],
                buffer[ offset + 1 + 16 ]
            )
                .toString();
        }

        default: {
            throw new Error('Address.read: Unknown ATYP: ' + buffer[ offset ]);
        }
    }
}


function readPort(
    buffer: Buffer, offset: number
): number {
    switch (buffer[ offset ]) {
        case ESocksAtyp.IpV4: {
            return buffer.readUInt16BE(8);
        }

        case ESocksAtyp.Dns: {
            return buffer.readUInt16BE(5 + buffer[ offset + 1 ]);
        }

        case ESocksAtyp.IpV6: {
            return buffer.readUInt16BE(20);
        }

        default: {
            throw new Error('Port.read: Unknown ATYP: ' + buffer[ offset ]);
        }
    }
}


export class ProxySocks extends EventEmitter {
    private readonly server: Server;

    private readonly sockets = new Sockets();

    private listenPromise?: Promise<number>;

    private closePromise?: Promise<void>;

    constructor(
        private readonly logger: LoggerService,
        private readonly timeout: number,
        private readonly credentials?: ISocksCredentials
    ) {
        super();

        this.server = createServer();

        this.server.on(
            'connection',
            (socket: SockSocket) => {
                socket.on(
                    'error',
                    (err: any) => {
                        this.emit(
                            'error',
                            err
                        );
                    }
                );

                socket.on(
                    'close',
                    () => {
                        this.sockets.remove(socket as Socket);
                    }
                );
                this.sockets.add(socket);

                // do a handshake
                socket.once(
                    'data',
                    (chunk) => {
                        // SOCKS Version 4/5 is the only support version
                        switch (chunk[ 0 ]) {
                            case 4: {
                                this.handshake4(
                                    socket,
                                    chunk
                                );

                                break;
                            }
                            case 5: {
                                this.handshake5(
                                    socket,
                                    chunk
                                );

                                break;
                            }

                            default: {
                                this.emit(
                                    'error',
                                    `handshake: wrong socks version: ${chunk[ 0 ]}`
                                );

                                socket.end();

                                break;
                            }
                        }
                    }
                );
            }
        );

        this.on(
            'connection',
            (
                socket: Socket,
                port: number,
                address: string,
                cb: () => void
            ) => {
                const proxySocket = createConnection(
                    {
                        port: port,
                        host: address,
                        timeout: this.timeout,
                    },
                    cb
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

                let localAddress: string | undefined = void 0;
                let localPort: number | undefined = void 0;

                proxySocket.on(
                    'connect',
                    () => {
                        localAddress = proxySocket.localAddress;
                        localPort = proxySocket.localPort;
                    }
                );

                proxySocket.on(
                    'data',
                    (chunk) => {
                        try {
                            if (!socket.write(chunk)) {
                                proxySocket.pause();

                                socket.on(
                                    'drain',
                                    () => {
                                        proxySocket.resume();
                                    }
                                );
                                setTimeout(
                                    () => {
                                        proxySocket.resume();
                                    },
                                    100
                                );
                            }
                        } catch (err: any) {
                        }
                    }
                );

                socket.on(
                    'data',
                    (chunk) => {
                        try {
                            if (!proxySocket.write(chunk)) {
                                socket.pause();

                                proxySocket.on(
                                    'drain',
                                    () => {
                                        socket.resume();
                                    }
                                );
                                setTimeout(
                                    () => {
                                        socket.resume();
                                    },
                                    100
                                );
                            }
                        } catch (err: any) {
                        }
                    }
                );

                proxySocket.on(
                    'close',
                    () => {
                        try {
                            if (!localAddress || !localPort) {
                                socket.end();
                            }
                        } catch (err: any) {
                        }
                    }
                );

                socket.on(
                    'close',
                    () => {
                        try {
                            if (proxySocket) {
                                proxySocket.removeAllListeners('data');
                                proxySocket.end();
                            }
                        } catch (err: any) {
                        }
                    }
                );
            }
        );
    }

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
        if (this.closePromise) {
            throw new Error('Server has already been stopped');
        }

        if (this.listenPromise) {
            return this.listenPromise;
        }

        this.listenPromise = new Promise<number>((
            resolve, reject
        ) => {
            this.server.once(
                'error',
                (err: any) => {
                    reject(new Error(`Proxy cannot listen at port ${port} : ${err.message}`));
                }
            );

            this.server.once(
                'listening',
                () => {
                    this.logger.debug?.(`[ProxyHttp] listen at ${this.port}`);

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

    // SOCKS5
    private handshake5(
        socket: SockSocket, chunk: Buffer
    ) {
        socket.socksVersion = 5;

        // Number of authentication methods
        const authMethods = [];
        // i starts on 2, since we've read chunk 0 & 1 already
        for (let i = 2; i < chunk[ 1 ] + 2; i++) {
            authMethods.push(chunk[ i ]);
        }

        // user/pass auth
        if (this.credentials) {
            if (authMethods.includes(ESocksAuth.UserPass)) {
                socket.once(
                    'data',
                    (chunk2) => {
                        this.handleAuthRequest(
                            socket,
                            chunk2
                        );
                    }
                );
                socket.write(Buffer.from([
                    0x05, ESocksAuth.UserPass,
                ]));
            } else {
                socket.end(Buffer.from([
                    0x05, ESocksAuth.None,
                ]));
            }
        } else
            // NO Auth
            if (authMethods.includes(ESocksAuth.NoAuth)) {
                socket.once(
                    'data',
                    (chunk2) => {
                        this.handleConnRequest(
                            socket,
                            chunk2
                        );
                    }
                );
                socket.write(Buffer.from([
                    0x05, ESocksAuth.NoAuth,
                ]));
            } else {
                socket.end(Buffer.from([
                    0x05, ESocksAuth.None,
                ]));
            }
    }

    // SOCKS4/4a
    private handshake4(
        socket: SockSocket, chunk: Buffer
    ) {
        socket.socksVersion = 4;

        const cmd = chunk[ 1 ];
        const port = chunk.readUInt16BE(2);

        // SOCKS4a
        if (chunk[ 4 ] === 0 &&
            chunk[ 5 ] === 0 &&
            chunk[ 6 ] === 0 &&
            chunk[ 7 ] != 0
        ) {
            let i: number;
            let uid = '';
            for (i = 0; i < 1024; i++) {
                uid += String.fromCharCode(chunk[ 8 + i ]);

                if (chunk[ 8 + i ] === 0x00) {
                    break;
                }
            }

            let address = '';

            if (chunk[ 8 + i ] === 0x00) {
                for (i++; i < 2048; i++) {
                    address += String.fromCharCode(chunk[ 8 + i ]);

                    if (chunk[ 8 + i ] === 0x00) {
                        break;
                    }
                }

                // DNS lookup
                lookup(
                    address,
                    (
                        err: any, ip: string
                    ) => {
                        if (err) {
                            this.emit(
                                'error',
                                `socks4a dns lookup failed: ${err.message}`
                            );

                            socket.end(Buffer.from([
                                0x00, 0x5b,
                            ]));
                        } else {
                            socket.socksAddress = ip;
                            socket.socksPort = port;
                            socket.socksUid = uid;

                            if (cmd === ESocksRequestCmd.Connect) {
                                socket.request = chunk;
                                this.emit(
                                    'connection',
                                    socket,
                                    port,
                                    ip,
                                    () => {
                                        this.proxyReady4(socket);
                                    }
                                );
                            } else {
                                socket.end(Buffer.from([
                                    0x00, 0x5b,
                                ]));
                            }
                        }
                    }
                );
            } else {
                socket.end(Buffer.from([
                    0x00, 0x5b,
                ]));
            }
        } else {
            // SOCKS4
            const address = `${chunk[ 4 ]}.${chunk[ 5 ]}.${chunk[ 6 ]}.${chunk[ 7 ]}`;
            let uid = '';
            for (let i = 0; i < 1024; i++) {
                uid += String.fromCharCode(chunk[ 8 + i ]);

                if (chunk[ 8 + i ] === 0x00) {
                    break;
                }
            }

            socket.socksAddress = address;
            socket.socksPort = port;
            socket.socksUid = uid;

            if (cmd === ESocksRequestCmd.Connect) {
                socket.request = chunk;

                this.emit(
                    'connection',
                    socket,
                    port,
                    address,
                    () => {
                        this.proxyReady4(socket);
                    }
                );
            } else {
                socket.end(Buffer.from([
                    0x00, 0x5b,
                ]));
            }
        }
    }

    private handleAuthRequest(
        socket: SockSocket, chunk: Buffer
    ) {
        let
            password: string,
            username: string;

        // Wrong version!
        if (chunk[ 0 ] !== 1) { // MUST be 1
            socket.end(Buffer.from([
                0x01, 0x01,
            ]));
            this.emit(
                'error',
                `socks5 handleAuthRequest: wrong socks version: ${chunk[ 0 ]}`
            );

            return;
        }

        try {
            const
                na = [],
                pa = [];
            let ni: number;
            for (ni = 2; ni < 2 + chunk[ 1 ]; ni++) {
                na.push(chunk[ ni ]);
            }

            username = Buffer.from(na)
                .toString('utf8');
            for (let i = ni + 1; i < ni + 1 + chunk[ ni ]; i++) {
                pa.push(chunk[ i ]);
            }
            password = Buffer.from(pa)
                .toString('utf8');
        } catch (err: any) {
            socket.end(Buffer.from([
                0x01, 0x01,
            ]));
            this.emit(
                'error',
                `socks5 handleAuthRequest: username/password ${err}`
            );

            return;
        }

        // check user:pass
        if (this.credentials && this.credentials.username === username && this.credentials.password === password) {
            socket.once(
                'data',
                (chunk2: Buffer) => {
                    this.handleConnRequest(
                        socket,
                        chunk2
                    );
                }
            );
            socket.write(Buffer.from([
                0x01, 0x00,
            ]));
        } else {
            socket.end(Buffer.from([
                0x01, 0x01,
            ]));
            this.emit(
                'error',
                `socks5 handleConnRequest: wrong socks version: ${chunk[ 0 ]}`
            );
        }
    }

    private handleConnRequest(
        socket: SockSocket, chunk: Buffer
    ) {
        const cmd = chunk[ 1 ];

        // Wrong version!
        if (chunk[ 0 ] !== 5) {
            socket.end(Buffer.from([
                0x05, 0x01,
            ]));
            this.emit(
                'error',
                `socks5 handleConnRequest: wrong socks version: ${chunk[ 0 ]}`
            );

            return;
        }

        let address: string;
        let port: number;
        try {
            address = readAddress(
                chunk,
                3
            );
            port = readPort(
                chunk,
                3
            );
        } catch (err: any) {
            this.emit(
                'error',
                `socks5 handleConnRequest: read address or port: ${err}`
            );

            return;
        }

        if (cmd === ESocksRequestCmd.Connect) {
            socket.request = chunk;

            this.emit(
                'connection',
                socket,
                port,
                address,
                () => {
                    this.proxyReady5(socket);
                }
            );
        } else {
            socket.end(Buffer.from([
                0x05, 0x01,
            ]));
        }
    }

    private proxyReady5(socket: SockSocket) {
        const resp = Buffer.alloc(socket.request!.length);
        socket.request!.copy(resp);

        resp[ 0 ] = 5;
        resp[ 1 ] = 0x00;
        resp[ 2 ] = 0x00;

        socket.write(resp);
    }

    private proxyReady4(socket: SockSocket) {
        const resp = Buffer.alloc(8);
        resp[ 0 ] = 0x00;
        resp[ 1 ] = 0x5a;

        // Port
        resp.writeUInt16BE(
            socket.socksPort,
            2
        );

        // IP
        const ipArr = socket.socksAddress!.split('.');
        resp.writeUInt8(
            parseInt(ipArr[ 0 ]),
            4
        );
        resp.writeUInt8(
            parseInt(ipArr[ 1 ]),
            5
        );
        resp.writeUInt8(
            parseInt(ipArr[ 2 ]),
            6
        );
        resp.writeUInt8(
            parseInt(ipArr[ 3 ]),
            7
        );

        socket.write(resp);
    }
}
