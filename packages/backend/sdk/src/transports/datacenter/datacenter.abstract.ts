import {
    IncomingMessage,
    request,
} from 'http';
import { Socket } from 'net';
import { connect } from 'tls';
import {
    SCRAPOXY_HEADER_PREFIX,
    SCRAPOXY_HEADER_PREFIX_LC,
} from '@scrapoxy/common';
import {
    createConnectionAuto,
    isUrl,
    urlOptionsToUrl,
} from '../../helpers';
import { HttpTransportError } from '../errors';
import { ATransportService } from '../transport.abstract';
import type { IProxyToConnectConfigDatacenter } from './datacenter.interface';
import type { IUrlOptions } from '../../helpers';
import type {
    IProxyToConnect,
    IProxyToRefresh,
} from '@scrapoxy/common';
import type { ISockets } from '@scrapoxy/proxy-sdk';
import type {
    ClientRequestArgs,
    OutgoingHttpHeaders,
    RequestOptions,
} from 'http';
import type { ConnectionOptions } from 'tls';


export abstract class ATransportDatacenterService extends ATransportService {
    buildRequestArgs(
        method: string | undefined,
        urlOpts: IUrlOptions,
        headers: OutgoingHttpHeaders,
        headersConnect: OutgoingHttpHeaders,
        proxy: IProxyToConnect,
        sockets: ISockets
    ): ClientRequestArgs {
        const config = proxy.config as IProxyToConnectConfigDatacenter;
        let ssl: boolean;
        switch (urlOpts.protocol) {
            case 'http:': {
                ssl = false;
                break;
            }

            case 'https:': {
                ssl = true;
                break;
            }

            default: {
                throw new Error(`Datacenter: Unsupported protocol: ${urlOpts.protocol}`);
            }
        }

        return {
            method,
            hostname: config.address.hostname,
            port: config.address.port,
            path: urlOptionsToUrl(
                urlOpts,
                false
            ),
            headers,
            timeout: proxy.timeoutDisconnected,
            createConnection: (
                args,
                oncreate
            ) => {
                const proxyReqArgs: RequestOptions = {
                    method: 'CONNECT',
                    hostname: args.hostname,
                    port: args.port,
                    path: headersConnect.Host as string,
                    headers: headersConnect,
                    timeout: proxy.timeoutDisconnected,
                    createConnection: (
                        args2,
                        oncreate2
                    ) => createConnectionAuto(
                        args2,
                        oncreate2,
                        sockets,
                        'ATransportDatacenter:buildRequestArgs',
                        config.certificate ? {
                            ca: config.certificate.cert,
                            cert: config.certificate.cert,
                            key: config.certificate.key,
                        } : void 0
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

                        let returnedSocket: Socket;

                        if (ssl) {
                            const options: ConnectionOptions = {
                                socket: proxySocket,
                                requestCert: true,
                                rejectUnauthorized: false,
                                timeout: proxy.timeoutDisconnected,
                            };

                            if (isUrl(urlOpts.hostname)) {
                                options.servername = urlOpts.hostname as string;
                            }

                            returnedSocket = connect(options);
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
                                'ATransportDatacenter:buildRequestArgs:createConnection:connect:returnedSocket'
                            );

                            returnedSocket.on(
                                'timeout',
                                () => {
                                    returnedSocket.destroy();
                                    returnedSocket.emit('close');
                                }
                            );
                        } else {
                            returnedSocket = proxySocket;
                        }

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

    buildFingerprintRequestArgs(
        method: string | undefined,
        urlOpts: IUrlOptions,
        headers: OutgoingHttpHeaders,
        headersConnect: OutgoingHttpHeaders,
        proxy: IProxyToRefresh,
        sockets: ISockets
    ): ClientRequestArgs {
        headersConnect[ `${SCRAPOXY_HEADER_PREFIX}-Metrics` ] = 'ignore';

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
        const config = proxy.config as IProxyToConnectConfigDatacenter;
        const proxyReq = request({
            method: 'CONNECT',
            hostname: config.address.hostname,
            port: config.address.port,
            path: url,
            headers,
            timeout: proxy.timeoutDisconnected,
            createConnection: (
                args,
                oncreate
            ) => createConnectionAuto(
                args,
                oncreate,
                sockets,
                'ATransportDatacenter:connect',
                config.certificate ? {
                    ca: config.certificate.cert,
                    cert: config.certificate.cert,
                    key: config.certificate.key,
                } : void 0
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

    protected override parseBodyError(
        r: IncomingMessage, callback: (err: Error) => void
    ) {
        const errorHeader = r.headers[ `${SCRAPOXY_HEADER_PREFIX_LC}-proxyerror` ] as string;

        if (errorHeader && errorHeader.length > 0) {
            callback(new Error(errorHeader));

            return;
        }

        super.parseBodyError(
            r,
            callback
        );
    }
}
