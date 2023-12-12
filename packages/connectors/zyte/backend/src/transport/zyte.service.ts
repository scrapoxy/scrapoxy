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
import { TRANSPORT_ZYTE_TYPE } from './zyte.constants';
import type { IProxyToConnectConfigZyte } from './zyte.interface';
import type {
    IConnectorZyteConfig,
    IConnectorZyteCredential,
} from '../zyte.interface';
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
export class TransportZyteService implements ITransportService {
    readonly type = TRANSPORT_ZYTE_TYPE;

    constructor(transportproviders: TransportprovidersService) {
        transportproviders.register(this);
    }

    completeProxyConfig(
        proxy: IConnectorProxyRefreshed, connector: IConnectorToRefresh
    ) {
        const proxyConfig = proxy.config as IProxyToConnectConfigZyte;
        const credentialConfig = connector.credentialConfig as IConnectorZyteCredential;
        proxyConfig.token = credentialConfig.token;

        const connectorConfig = connector.connectorConfig as IConnectorZyteConfig;
        proxyConfig.region = connectorConfig.region;
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
        const config = proxy.config as IProxyToConnectConfigZyte;
        const auth = btoa(`${config.token}:`);

        if (urlOpts.ssl) {
            // HTTPS request
            return {
                method,
                hostname: 'proxy.crawlera.com',
                port: 8011,
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
                    headersConnect[ 'Proxy-Authorization' ] = `Basic ${auth}`;
                    headersConnect[ 'X-Crawlera-Session' ] = proxy.key;

                    if (config.region !== 'all') {
                        headersConnect[ 'X-Crawlera-Region' ] = config.region.toUpperCase();
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
                            'TransportZyteService:https:buildRequestArgs'
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
                                'TransportZyteService:buildRequestArgs:createConnection:connect'
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
            headers[ 'Proxy-Authorization' ] = `Basic ${auth}`;
            headers[ 'X-Crawlera-Session' ] = proxy.key;

            if (config.region !== 'all') {
                headers[ 'X-Crawlera-Region' ] = config.region;
            }

            return {
                method,
                hostname: 'proxy.crawlera.com',
                port: 8011,
                path: httpOptionsToUrl(
                    urlOpts,
                    true
                ),
                headers,
                timeout,
                createConnection: (
                    opts,
                    oncreate
                ) => createConnectionAuto(
                    opts,
                    oncreate,
                    sockets,
                    'TransportZyte:buildRequestArgs'
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
        const config = proxy.config as IProxyToConnectConfigZyte;
        const auth = btoa(`${config.token}:`);

        headers[ 'Proxy-Authorization' ] = `Basic ${auth}`;
        headers[ 'X-Crawlera-Session' ] = proxy.key;

        if (config.region !== 'all') {
            headers[ 'X-Crawlera-Region' ] = config.region;
        }

        return {
            method: 'CONNECT',
            hostname: 'proxy.crawlera.com',
            port: 8011,
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
                'TransportZyte:buildConnectArgs'
            ),
        };
    }
}
