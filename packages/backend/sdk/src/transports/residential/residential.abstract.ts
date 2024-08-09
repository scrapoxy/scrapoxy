import {
    IncomingMessage,
    request,
} from 'http';
import { Socket } from 'net';
import { connect } from 'tls';
import { SCRAPOXY_HEADER_PREFIX_LC } from '@scrapoxy/common';
import {
    createConnectionAuto,
    isUrl,
    urlOptionsToUrl,
} from '../../helpers';
import { HttpTransportError } from '../errors';
import { ATransportService } from '../transport.abstract';
import type { IProxyToConnectConfigResidential } from './residential.interface';
import type {
    ArrayHttpHeaders,
    IUrlOptions,
} from '../../helpers';
import type {
    IProxyToConnect,
    IProxyToRefresh,
} from '@scrapoxy/common';
import type { ISockets } from '@scrapoxy/proxy-sdk';
import type {
    ClientRequestArgs,
    OutgoingHttpHeaders,
} from 'http';
import type { ConnectionOptions } from 'tls';


export abstract class ATransportResidentialService extends ATransportService {
    buildRequestArgs(
        method: string | undefined,
        urlOpts: IUrlOptions,
        headers: ArrayHttpHeaders,
        headersConnect: OutgoingHttpHeaders,
        proxy: IProxyToConnect,
        sockets: ISockets
    ): ClientRequestArgs {
        const config = proxy.config as IProxyToConnectConfigResidential;

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
                    proxy.timeoutDisconnected,
                    proxy.ciphers
                );
            }

            default: {
                throw new Error(`Residential: Unsupported protocol: ${urlOpts.protocol}`);
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
        const config = proxy.config as IProxyToConnectConfigResidential;
        const token = btoa(`${config.username}:${config.password}`);
        headers[ 'Proxy-Authorization' ] = `Basic ${token}`;

        const proxyReq = request({
            method: 'CONNECT',
            hostname: config.address.hostname,
            port: config.address.port,
            path: url,
            headers,
            timeout: proxy.timeoutDisconnected,
            createConnection: (
                opts,
                oncreate
            ) => createConnectionAuto(
                opts,
                oncreate,
                sockets,
                'ATransportResidential:connect',
                void 0
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

    private buildRequestArgsHttp(
        method: string | undefined,
        urlOpts: IUrlOptions,
        headers: ArrayHttpHeaders,
        config: IProxyToConnectConfigResidential,
        sockets: ISockets,
        timeout: number
    ): ClientRequestArgs {
        const token = btoa(`${config.username}:${config.password}`);
        headers.addHeader(
            'Proxy-Authorization',
            `Basic ${token}`
        );

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
                'ATransportResidential:buildRequestArgs:createConnection',
                void 0
            ),
        };
    }

    private buildRequestArgsHttps(
        method: string | undefined,
        urlOpts: IUrlOptions,
        headers: ArrayHttpHeaders,
        headersConnect: OutgoingHttpHeaders,
        config: IProxyToConnectConfigResidential,
        sockets: ISockets,
        timeout: number,
        ciphers: string | null
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
                const token = btoa(`${config.username}:${config.password}`);
                headersConnect[ 'Proxy-Authorization' ] = `Basic ${token}`;

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
                        'ATransportResidential:https:buildRequestArgs',
                        void 0
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

                        if (ciphers) {
                            options.ciphers = ciphers;
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
                            'ATransportResidential:buildRequestArgs:createConnection:connect'
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
}
