import {
    IncomingMessage,
    request,
} from 'http';
import { Socket } from 'net';
import { connect } from 'tls';
import { Injectable } from '@nestjs/common';
import { TRANSPORT_PROXY_TYPE } from './proxy.constants';
import {
    createConnectionAuto,
    httpOptionsToUrl,
    isUrl,
    parseBodyError,
} from '../../helpers';
import { TransportprovidersService } from '../providers.service';
import type { IHttpOptions } from '../../helpers';
import type { ITransportService } from '../transport.interface';
import type {
    IConnectorProxyRefreshed,
    IConnectorToRefresh,
    IProxyToConnect,
    IProxyTransport,
} from '@scrapoxy/common';
import type { ISockets } from '@scrapoxy/proxy-sdk';
import type {
    ClientRequestArgs,
    OutgoingHttpHeaders,
} from 'http';
import type { ConnectionOptions } from 'tls';


export abstract class ATransportProxyService implements ITransportService {
    abstract type: string;

    abstract completeProxyConfig(proxy: IConnectorProxyRefreshed, connector: IConnectorToRefresh): void;

    buildRequestArgs(
        method: string | undefined,
        urlOpts: IHttpOptions,
        headers: OutgoingHttpHeaders,
        headersConnect: OutgoingHttpHeaders,
        proxy: IProxyToConnect,
        sockets: ISockets,
        timeout: number
    ): ClientRequestArgs {
        const config = proxy.config as IProxyTransport;

        if (urlOpts.ssl) {
            // HTTPS request
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
        } else {
            // HTTP request
            if (config.auth) {
                const token = btoa(`${config.auth.username}:${config.auth.password}`);
                headers[ 'Proxy-Authorization' ] = `Basic ${token}`;
            }

            return {
                method,
                hostname: config.address.hostname,
                port: config.address.port,
                path: httpOptionsToUrl(
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
                    void 0
                ),
            };
        }
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
                void 0
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
