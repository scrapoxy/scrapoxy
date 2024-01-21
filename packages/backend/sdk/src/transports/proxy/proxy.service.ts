import {
    IncomingMessage,
    request,
} from 'http';
import { Socket } from 'net';
import { connect } from 'tls';
import { Injectable } from '@nestjs/common';
import { EProxyType } from '@scrapoxy/common';
import { SocksClient } from 'socks';
import { TRANSPORT_PROXY_TYPE } from './proxy.constants';
import {
    createConnectionAuto,
    isUrl,
    parseBodyError,
    urlOptionsToUrl,
} from '../../helpers';
import { TransportprovidersService } from '../providers.service';
import type { IUrlOptions } from '../../helpers';
import type { ITransportService } from '../transport.interface';
import type {
    IConnectorProxyRefreshed,
    IConnectorToRefresh,
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


export abstract class ATransportProxyService implements ITransportService {
    abstract type: string;

    abstract completeProxyConfig(proxy: IConnectorProxyRefreshed, connector: IConnectorToRefresh): void;

    buildRequestArgs(
        method: string | undefined,
        urlOpts: IUrlOptions,
        headers: OutgoingHttpHeaders,
        headersConnect: OutgoingHttpHeaders,
        proxy: IProxyToConnect,
        sockets: ISockets,
        timeout: number
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
                            timeout
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
                            timeout
                        );
                    }

                    default: {
                        throw new Error(`Proxy: Unsupported protocol: ${urlOpts.protocol}`);
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
                            timeout
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
                            timeout
                        );
                    }

                    default: {
                        throw new Error(`Proxy: Unsupported protocol: ${urlOpts.protocol}`);
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
                            timeout,
                            4
                        );
                    }

                    default: {
                        throw new Error(`Proxy: Unsupported protocol: ${urlOpts.protocol}`);
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
                            timeout,
                            5
                        );
                    }

                    default: {
                        throw new Error(`Proxy: Unsupported protocol: ${urlOpts.protocol}`);
                    }
                }
            }

            default: {
                throw new Error(`Proxy: Unsupported proxy type: ${config.type}`);
            }
        }
    }

    buildFingerprintRequestArgs(
        method: string | undefined,
        urlOpts: IUrlOptions,
        headers: OutgoingHttpHeaders,
        headersConnect: OutgoingHttpHeaders,
        proxy: IProxyToRefresh,
        sockets: ISockets,
        timeout: number
    ): ClientRequestArgs {
        return this.buildRequestArgs(
            method,
            urlOpts,
            headers,
            headersConnect,
            proxy,
            sockets,
            timeout
        );
    }

    buildConnectArgs(
        url: string,
        headers: OutgoingHttpHeaders,
        proxy: IProxyToConnect,
        sockets: ISockets,
        timeout: number
    ): ClientRequestArgs {
        const config = proxy.config as IProxyTransport;

        switch (config.type) {
            case EProxyType.HTTP: {
                return this.buildConnectArgsImpl(
                    url,
                    headers,
                    config,
                    sockets,
                    timeout
                );
            }

            case EProxyType.HTTPS: {
                return this.buildConnectArgsImpl(
                    url,
                    headers,
                    config,
                    sockets,
                    timeout
                );
            }

            default: {
                throw new Error(`Proxy: Unsupported proxy type: ${config.type}`);
            }
        }
    }

    private buildRequestArgsHttp(
        method: string | undefined,
        urlOpts: IUrlOptions,
        headers: OutgoingHttpHeaders,
        config: IProxyTransport,
        sockets: ISockets,
        timeout: number
    ): ClientRequestArgs {
        if (config.auth) {
            const token = btoa(`${config.auth.username}:${config.auth.password}`);
            headers[ 'Proxy-Authorization' ] = `Basic ${token}`;
        }

        return {
            method,
            hostname: config.address.hostname,
            port: config.address.port,
            path: urlOptionsToUrl(
                urlOpts,
                true
            ),
            headers,
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
        headers: OutgoingHttpHeaders,
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
            headers,
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
                            parseBodyError(
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
        headers: OutgoingHttpHeaders,
        config: IProxyTransport,
        sockets: ISockets,
        timeout: number,
        type: SocksProxyType
    ): ClientRequestArgs {
        if (config.auth) {
            const token = btoa(`${config.auth.username}:${config.auth.password}`);
            headers[ 'Proxy-Authorization' ] = `Basic ${token}`;
        }

        return {
            method,
            hostname: config.address.hostname,
            port: config.address.port,
            path: urlOptionsToUrl(
                urlOpts,
                true
            ),
            headers,
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
                };

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
                                    rejectUnauthorized: false,
                                    timeout: args.timeout,
                                };

                                if (isUrl(args.hostname)) {
                                    optionsTls.servername = args.hostname as string;
                                }

                                socket = connect(optionsTls);
                            } else {
                                socket = info!.socket as Socket;
                            }

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

    private buildConnectArgsImpl(
        url: string,
        headers: OutgoingHttpHeaders,
        config: IProxyTransport,
        sockets: ISockets,
        timeout: number
    ): ClientRequestArgs {
        if (config.auth) {
            const token = btoa(`${config.auth.username}:${config.auth.password}`);
            headers[ 'Proxy-Authorization' ] = `Basic ${token}`;
        }

        return {
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
                'TransportProxyService:buildConnectArgs',
                config.type === EProxyType.HTTPS ? {} : void 0
            ),
        };
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
