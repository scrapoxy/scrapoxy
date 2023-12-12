import {
    IncomingMessage,
    request,
} from 'http';
import { Socket } from 'net';
import { connect } from 'tls';
import { SCRAPOXY_HEADER_PREFIX } from '@scrapoxy/common';
import {
    createConnectionAuto,
    httpOptionsToUrl,
    isUrl,
    parseBodyError,
} from '../../helpers';
import type { IProxyToConnectConfigCloud } from './cloud.interface';
import type { IHttpOptions } from '../../helpers';
import type { ITransportService } from '../transport.interface';
import type {
    IConnectorProxyRefreshed,
    IConnectorToRefresh,
    IProxyToConnect,
} from '@scrapoxy/common';
import type { ISockets } from '@scrapoxy/proxy-sdk';
import type {
    ClientRequestArgs,
    OutgoingHttpHeaders,
    RequestOptions,
} from 'http';
import type { ConnectionOptions } from 'tls';


export abstract class ATransportCloudService implements ITransportService {
    abstract type: string;

    abstract completeProxyConfig(
        proxy: IConnectorProxyRefreshed, connector: IConnectorToRefresh
    ): void;

    buildRequestArgs(
        method: string | undefined,
        urlOpts: IHttpOptions,
        headers: OutgoingHttpHeaders,
        headersConnect: OutgoingHttpHeaders,
        proxy: IProxyToConnect,
        sockets: ISockets,
        timeout: number
    ): ClientRequestArgs {
        const config = proxy.config as IProxyToConnectConfigCloud;

        return {
            method,
            hostname: config.address.hostname,
            port: config.address.port,
            path: httpOptionsToUrl(
                urlOpts,
                false
            ),
            headers,
            timeout,
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
                    timeout,
                    createConnection: (
                        args2,
                        oncreate2
                    ) => createConnectionAuto(
                        args2,
                        oncreate2,
                        sockets,
                        'ATransportCloud:buildRequestArgs',
                        {
                            ca: config.certificate.cert,
                            cert: config.certificate.cert,
                            key: config.certificate.key,
                        }
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

                        let returnedSocket: Socket;

                        if (urlOpts.ssl) {
                            const options: ConnectionOptions = {
                                socket: proxySocket,
                                requestCert: true,
                                rejectUnauthorized: false,
                                timeout,
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
                                'ATransportCloud:buildRequestArgs:createConnection:connect:returnedSocket'
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
        urlOpts: IHttpOptions,
        headers: OutgoingHttpHeaders,
        headersConnect: OutgoingHttpHeaders,
        proxy: IProxyToConnect,
        sockets: ISockets,
        timeout: number
    ): ClientRequestArgs {
        headersConnect[ `${SCRAPOXY_HEADER_PREFIX}-Metrics` ] = 'ignore';

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
        const config = proxy.config as IProxyToConnectConfigCloud;

        return {
            method: 'CONNECT',
            hostname: config.address.hostname,
            port: config.address.port,
            path: url,
            headers,
            timeout,
            createConnection: (
                args,
                oncreate
            ) => createConnectionAuto(
                args,
                oncreate,
                sockets,
                'ATransportCloud:buildConnectArgs',
                {
                    ca: config.certificate.cert,
                    cert: config.certificate.cert,
                    key: config.certificate.key,
                }
            ),
        };
    }
}
