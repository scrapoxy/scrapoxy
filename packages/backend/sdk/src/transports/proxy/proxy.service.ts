import {
    IncomingMessage,
    request,
} from 'http';
import { Socket } from 'net';
import { connect } from 'tls';
import { Injectable } from '@nestjs/common';
import {
    EProxyType,
    SCRAPOXY_HEADER_PREFIX_LC,
} from '@scrapoxy/common';
import { SocksClient } from 'socks';
import { TRANSPORT_PROXY_TYPE } from './proxy.constants';
import {
    createConnectionAuto,
    isUrl,
    urlOptionsToUrl,
} from '../../helpers';
import { HttpTransportError } from '../errors';
import { TransportprovidersService } from '../providers.service';
import { ATransportService } from '../transport.abstract';
import type {
    ArrayHttpHeaders,
    IUrlOptions,
} from '../../helpers';
import type {
    IProxyToConnect,
    IProxyToRefresh,
    IProxyTransport,
} from '@scrapoxy/common';
import type { ISockets } from '@scrapoxy/proxy-sdk';
import type {
    ClientRequestArgs,
    OutgoingHttpHeaders,
} from 'http';
import type { SocksClientOptions } from 'socks';
import type { SocksProxyType } from 'socks/typings/common/constants';
import type { ConnectionOptions } from 'tls';


export abstract class ATransportProxyService extends ATransportService {
    buildRequestArgs(
        method: string | undefined,
        urlOpts: IUrlOptions,
        headers: ArrayHttpHeaders,
        headersConnect: OutgoingHttpHeaders,
        proxy: IProxyToConnect,
        sockets: ISockets
    ): ClientRequestArgs {
        const config = proxy.config as IProxyTransport;

        switch (config.type) {
            case EProxyType.HTTP: {
                switch (urlOpts.protocol) {
                    case 'http:': {
                        return this.buildRequestArgsHttp(
                            method,
                            urlOpts,
                            headers,
                            config,
                            sockets,
                            proxy.timeoutDisconnected
                        );
                    }

                    case 'https:': {
                        return this.buildRequestArgsHttps(
                            method,
                            urlOpts,
                            headers,
                            headersConnect,
                            config,
                            sockets,
                            proxy.timeoutDisconnected
                        );
                    }

                    default: {
                        throw new Error(`Unsupported protocol: ${urlOpts.protocol}`);
                    }
                }
            }

            case EProxyType.HTTPS: {
                switch (urlOpts.protocol) {
                    case 'http:': {
                        return this.buildRequestArgsHttp(
                            method,
                            urlOpts,
                            headers,
                            config,
                            sockets,
                            proxy.timeoutDisconnected
                        );
                    }

                    case 'https:': {
                        return this.buildRequestArgsHttps(
                            method,
                            urlOpts,
                            headers,
                            headersConnect,
                            config,
                            sockets,
                            proxy.timeoutDisconnected
                        );
                    }

                    default: {
                        throw new Error(`Unsupported protocol: ${urlOpts.protocol}`);
                    }
                }
            }

            case EProxyType.SOCKS4: {
                switch (urlOpts.protocol) {
                    case 'http:':
                    case 'https:': {
                        return this.buildRequestArgsSocks(
                            method,
                            urlOpts,
                            headers,
                            config,
                            sockets,
                            proxy.timeoutDisconnected,
                            4
                        );
                    }

                    default: {
                        throw new Error(`Unsupported protocol: ${urlOpts.protocol}`);
                    }
                }
            }

            case EProxyType.SOCKS5: {
                switch (urlOpts.protocol) {
                    case 'http:':
                    case 'https:': {
                        return this.buildRequestArgsSocks(
                            method,
                            urlOpts,
                            headers,
                            config,
                            sockets,
                            proxy.timeoutDisconnected,
                            5
                        );
                    }

                    default: {
                        throw new Error(`Unsupported protocol: ${urlOpts.protocol}`);
                    }
                }
            }

            default: {
                throw new Error(`Unsupported proxy type: ${config.type}`);
            }
        }
    }

    buildFingerprintRequestArgs(
        method: string | undefined,
        urlOpts: IUrlOptions,
        headers: ArrayHttpHeaders,
        headersConnect: OutgoingHttpHeaders,
        proxy: IProxyToRefresh,
        sockets: ISockets
    ): ClientRequestArgs {
        return this.buildRequestArgs(
            method,
            urlOpts,
            headers,
            headersConnect,
            proxy,
            sockets
        );
    }

    connect(
        url: string,
        headers: OutgoingHttpHeaders,
        proxy: IProxyToConnect,
        sockets: ISockets,
        callback: (err: Error, socket: Socket) => void
    ) {
        const config = proxy.config as IProxyTransport;

        switch (config.type) {
            case EProxyType.HTTP:
            case EProxyType.HTTPS: {
                this.connectHttpAndHttps(
                    url,
                    headers,
                    config,
                    sockets,
                    proxy.timeoutDisconnected,
                    callback
                );

                break;
            }

            case EProxyType.SOCKS4: {
                this.connectSocks(
                    url,
                    config,
                    sockets,
                    proxy.timeoutDisconnected,
                    4,
                    callback
                );

                break;
            }

            case EProxyType.SOCKS5: {
                this.connectSocks(
                    url,
                    config,
                    sockets,
                    proxy.timeoutDisconnected,
                    5,
                    callback
                );

                break;
            }

            default: {
                throw new Error(`Unsupported proxy type: ${config.type}`);
            }
        }
    }

    private buildRequestArgsHttp(
        method: string | undefined,
        urlOpts: IUrlOptions,
        headers: ArrayHttpHeaders,
        config: IProxyTransport,
        sockets: ISockets,
        timeout: number
    ): ClientRequestArgs {
        if (config.auth) {
            const token = btoa(`${config.auth.username}:${config.auth.password}`);
            headers.addHeader(
                'Proxy-Authorization',
                `Basic ${token}`
            );
        }

        return {
            method,
            hostname: config.address.hostname,
            port: config.address.port,
            path: urlOptionsToUrl(
                urlOpts,
                true
            ),
            headers: headers.toArray() as any, // should accept also [string, string][]
            timeout,
            createConnection: (
                args,
                oncreate
            ): Socket => createConnectionAuto(
                args,
                oncreate,
                sockets,
                'TransportProxyService:buildRequestArgs:createConnection',
                config.type === EProxyType.HTTPS ? {} : void 0
            ),
        };
    }

    private buildRequestArgsHttps(
        method: string | undefined,
        urlOpts: IUrlOptions,
        headers: ArrayHttpHeaders,
        headersConnect: OutgoingHttpHeaders,
        config: IProxyTransport,
        sockets: ISockets,
        timeout: number
    ): ClientRequestArgs {
        return {
            method,
            hostname: config.address.hostname,
            port: config.address.port,
            path: urlOptionsToUrl(
                urlOpts,
                false
            ),
            headers: headers.toArray() as any, // should accept also [string, string][]
            timeout,
            createConnection: (
                args,
                oncreate
            ) => {
                if (config.auth) {
                    const token = btoa(`${config.auth.username}:${config.auth.password}`);
                    headersConnect[ 'Proxy-Authorization' ] = `Basic ${token}`;
                }

                const proxyReqArgs: ClientRequestArgs = {
                    method: 'CONNECT',
                    hostname: args.hostname,
                    port: args.port,
                    path: headersConnect.Host as string,
                    headers: headersConnect,
                    timeout,
                    createConnection: (
                        args2,
                        oncreate2
                    ) => createConnectionAuto(
                        args2,
                        oncreate2,
                        sockets,
                        'TransportProxyService:https:buildRequestArgs',
                        config.type === EProxyType.HTTPS ? {} : void 0
                    ),
                };
                const proxyReq = request(proxyReqArgs);
                proxyReq.on(
                    'error',
                    (err: any) => {
                        oncreate(
                            err,
                            void 0 as any
                        );
                    }
                );

                proxyReq.on(
                    'connect',
                    (
                        proxyRes: IncomingMessage, proxySocket: Socket
                    ) => {
                        proxyRes.on(
                            'error',
                            (err: any) => {
                                oncreate(
                                    err,
                                    void 0 as any
                                );
                            }
                        );

                        proxySocket.on(
                            'error',
                            (err: any) => {
                                oncreate(
                                    err,
                                    void 0 as any
                                );
                            }
                        );

                        proxyReq.on(
                            'close',
                            () => {
                                sockets.remove(proxySocket);
                            }
                        );

                        if (proxyRes.statusCode !== 200) {
                            this.parseBodyError(
                                proxyRes,
                                (err: any) => {
                                    oncreate(
                                        err,
                                        void 0 as any
                                    );
                                }
                            );

                            return;
                        }

                        const options: ConnectionOptions = {
                            socket: proxySocket,
                            requestCert: true,
                            rejectUnauthorized: false,
                            timeout,
                        };

                        if (isUrl(urlOpts.hostname)) {
                            options.servername = urlOpts.hostname as string;
                        }

                        const returnedSocket = connect(options);
                        returnedSocket.on(
                            'error',
                            (err: any) => {
                                oncreate(
                                    err,
                                    void 0 as any
                                );
                            }
                        );

                        returnedSocket.on(
                            'close',
                            () => {
                                sockets.remove(returnedSocket);
                            }
                        );
                        sockets.add(
                            returnedSocket,
                            'TransportProxyService:buildRequestArgs:createConnection:connect'
                        );

                        returnedSocket.on(
                            'timeout',
                            () => {
                                returnedSocket.destroy();
                                returnedSocket.emit('close');
                            }
                        );

                        oncreate(
                            void 0 as any,
                            returnedSocket
                        );
                    }
                );

                proxyReq.end();

                return void 0 as any;
            },
        };
    }

    private buildRequestArgsSocks(
        method: string | undefined,
        urlOpts: IUrlOptions,
        headers: ArrayHttpHeaders,
        config: IProxyTransport,
        sockets: ISockets,
        timeout: number,
        type: SocksProxyType
    ): ClientRequestArgs {
        return {
            method,
            hostname: config.address.hostname,
            port: config.address.port,
            path: urlOptionsToUrl(
                urlOpts,
                true
            ),
            headers: headers.toArray() as any, // should accept also [string, string][]
            timeout,
            createConnection: (
                args,
                oncreate
            ) => {
                const options: SocksClientOptions = {
                    proxy: {
                        host: config.address.hostname,
                        port: config.address.port,
                        type,
                    },
                    command: 'connect',
                    destination: {
                        host: urlOpts.hostname as string,
                        port: urlOpts.port as number,
                    },
                    timeout,
                };

                if (config.auth) {
                    options.proxy.userId = config.auth.username;
                    options.proxy.password = config.auth.password;
                }

                SocksClient.createConnection(
                    options,
                    (
                        err, info
                    ) => {
                        if (err) {
                            oncreate(
                                err as any,
                                void 0 as any
                            );
                        } else {
                            let socket: Socket;

                            if (urlOpts.protocol === 'https:') {
                                const optionsTls: ConnectionOptions = {
                                    socket: info!.socket,
                                    requestCert: true,
                                    rejectUnauthorized: false, // Can accept MITM...
                                    timeout: args.timeout,
                                };

                                if (isUrl(args.hostname)) {
                                    optionsTls.servername = urlOpts.hostname as string;
                                }

                                socket = connect(optionsTls);
                            } else {
                                socket = info!.socket as Socket;
                            }

                            socket.on(
                                'error',
                                (errSocket) => {
                                    oncreate(
                                        errSocket,
                                        void 0 as any
                                    );
                                }
                            );

                            socket.on(
                                'close',
                                () => {
                                    sockets.remove(socket);
                                }
                            );
                            sockets.add(
                                socket,
                                'TransportProxyService:buildRequestArgsSocks:createConnection'
                            );

                            oncreate(
                                void 0 as any,
                                socket
                            );
                        }
                    }
                )
                    .catch(() => {
                        // Ignored because already caught by SocksClient.createConnection()
                    });

                return void 0 as any;
            },
        };
    }

    private connectHttpAndHttps(
        url: string,
        headers: OutgoingHttpHeaders,
        config: IProxyTransport,
        sockets: ISockets,
        timeout: number,
        callback: (err: Error, socket: Socket) => void
    ) {
        if (config.auth) {
            const token = btoa(`${config.auth.username}:${config.auth.password}`);
            headers[ 'Proxy-Authorization' ] = `Basic ${token}`;
        }

        const proxyReq = request({
            method: 'CONNECT',
            hostname: config.address.hostname,
            port: config.address.port,
            path: url,
            headers,
            timeout,
            createConnection: (
                opts,
                oncreate
            ) => createConnectionAuto(
                opts,
                oncreate,
                sockets,
                'TransportProxyService:connectHttpAndHttps:createConnection',
                config.type === EProxyType.HTTPS ? {} : void 0
            ),
        });

        proxyReq.on(
            'error',
            (err: any) => {
                callback(
                    err,
                    void 0 as any
                );
            }
        );

        proxyReq.on(
            'connect',
            (
                proxyRes: IncomingMessage, socket: Socket
            ) => {
                if (proxyRes.statusCode === 200) {
                    callback(
                        void 0 as any,
                        socket
                    );
                } else {
                    callback(
                        new HttpTransportError(
                            proxyRes.statusCode,
                            proxyRes.headers[ `${SCRAPOXY_HEADER_PREFIX_LC}-proxyerror` ] as string || proxyRes.statusMessage as string
                        ),
                        void 0 as any
                    );
                }
            }
        );

        proxyReq.end();
    }

    private connectSocks(
        url: string,
        config: IProxyTransport,
        sockets: ISockets,
        timeout: number,
        type: SocksProxyType,
        callback: (err: Error, socket: Socket) => void
    ) {
        const [
            host, portRaw,
        ] = url.split(':');
        let port: number;
        try {
            port = parseInt(
                portRaw,
                10
            );
        } catch (err: any) {
            callback(
                new Error(`Invalid port in ${url}`),
                void 0 as any
            );

            return;
        }

        const options: SocksClientOptions = {
            proxy: {
                host: config.address.hostname,
                port: config.address.port,
                type,
            },
            command: 'connect',
            destination: {
                host,
                port,
            },
            timeout,
        };

        if (config.auth) {
            options.proxy.userId = config.auth.username;
            options.proxy.password = config.auth.password;
        }

        SocksClient.createConnection(
            options,
            (
                err, info
            ) => {
                if (err) {
                    callback(
                        err as any,
                        void 0 as any
                    );
                } else {
                    const socket = info!.socket as Socket;

                    socket.on(
                        'error',
                        (errSocket) => {
                            callback(
                                errSocket,
                                void 0 as any
                            );
                        }
                    );

                    socket.on(
                        'close',
                        () => {
                            sockets.remove(socket);
                        }
                    );
                    sockets.add(
                        socket,
                        'TransportProxyService:connectSocks:createConnection'
                    );

                    callback(
                        void 0 as any,
                        socket
                    );
                }
            }
        )
            .catch(() => {
                // Ignored because already caught by SocksClient.createConnection()
            });
    }
}


@Injectable()
export class TransportProxyService extends ATransportProxyService {
    readonly type = TRANSPORT_PROXY_TYPE;

    constructor(transportproviders: TransportprovidersService) {
        super();

        transportproviders.register(this);
    }

    completeProxyConfig() { }
}
