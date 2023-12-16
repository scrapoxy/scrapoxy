import {
    IncomingMessage,
    request,
} from 'http';
import { Socket } from 'net';
import { connect } from 'tls';
import { Injectable } from '@nestjs/common';
import {
    createConnectionAuto,
    httpOptionsToUrl,
    isUrl,
    parseBodyError,
    TransportprovidersService,
} from '@scrapoxy/backend-sdk';
import { TRANSPORT_PROXYRACK_TYPE } from './proxyrack.constants';
import { DEFAULT_PROXYRACK_PORT } from '../api';
import {
    formatUsername,
    productToHostname,
} from '../proxyrack.helpers';
import type { IProxyToConnectConfigProxyrack } from './proxyrack.interface';
import type {
    IConnectorProxyrackConfig,
    IConnectorProxyrackCredential,
} from '../proxyrack.interface';
import type {
    IHttpOptions,
    ITransportService,
} from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IConnectorToRefresh,
    IProxyToConnect,
} from '@scrapoxy/common';
import type { ISockets } from '@scrapoxy/proxy-sdk';
import type {
    ClientRequestArgs,
    OutgoingHttpHeaders,
} from 'http';
import type { ConnectionOptions } from 'tls';


@Injectable()
export class TransportProxyrackService implements ITransportService {
    readonly type = TRANSPORT_PROXYRACK_TYPE;

    constructor(transportproviders: TransportprovidersService) {
        transportproviders.register(this);
    }

    completeProxyConfig(
        proxy: IConnectorProxyRefreshed, connector: IConnectorToRefresh
    ) {
        const
            connectorConfig = connector.connectorConfig as IConnectorProxyrackConfig,
            credentialConfig = connector.credentialConfig as IConnectorProxyrackCredential,
            proxyConfig = proxy.config as IProxyToConnectConfigProxyrack;

        proxyConfig.address = {
            hostname: productToHostname(credentialConfig.product),
            port: DEFAULT_PROXYRACK_PORT,
        };
        proxyConfig.username = formatUsername(
            credentialConfig.username,
            {
                ...connectorConfig,
                session: proxy.key,
            }
        );
        proxyConfig.password = credentialConfig.password;
    }

    buildRequestArgs(
        method: string | undefined,
        urlOpts: IHttpOptions,
        headers: OutgoingHttpHeaders,
        headersConnect: OutgoingHttpHeaders,
        proxy: IProxyToConnect,
        sockets: ISockets,
        timeout: number
    ): ClientRequestArgs {
        const config = proxy.config as IProxyToConnectConfigProxyrack;

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
                            'TransportProxyrackService:https:buildRequestArgs',
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
                                'TransportProxyrackService:buildRequestArgs:createConnection:connect'
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
            const token = btoa(`${config.username}:${config.password}`);
            headers[ 'Proxy-Authorization' ] = `Basic ${token}`;

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
                    'TransportProxyrackService:buildRequestArgs:createConnection',
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
        const config = proxy.config as IProxyToConnectConfigProxyrack;
        const token = btoa(`${config.username}:${config.password}`);
        headers[ 'Proxy-Authorization' ] = `Basic ${token}`;

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
                'TransportProxyrackService:buildConnectArgs',
                void 0
            ),
        };
    }
}
