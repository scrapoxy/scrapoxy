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
    urlToHttpOptions,
} from '@scrapoxy/backend-sdk';
import { TRANSPORT_PROXYLOCAL_TYPE } from './proxylocal.constants';
import type { IProxyToConnectConfigProxylocal } from './proxylocal.interface';
import type {
    IConnectorProxylocalConfig,
    IConnectorProxylocalCredential,
} from '../proxylocal.interface';
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
export class TransportProxylocalService implements ITransportService {
    readonly type = TRANSPORT_PROXYLOCAL_TYPE;

    constructor(transportproviders: TransportprovidersService) {
        transportproviders.register(this);
    }

    completeProxyConfig(
        proxy: IConnectorProxyRefreshed, connector: IConnectorToRefresh
    ) {
        const proxyConfig = proxy.config as IProxyToConnectConfigProxylocal;
        const credentialConfig = connector.credentialConfig as IConnectorProxylocalCredential;
        proxyConfig.token = credentialConfig.token;

        const connectorConfig = connector.connectorConfig as IConnectorProxylocalConfig;
        proxyConfig.region = connectorConfig.region;

        proxyConfig.fingerprintForce = {
            ip: '1.1.1.1',
            useragent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ',
            asnNetwork: '1.1.1.0/24',
            asnName: 'Dummy ASN',
            continentName: connectorConfig.region,
            continentCode: 'XX',
            countryName: 'France',
            countryCode: 'FR',
            cityName: 'Paris',
            latitude: 48.8566,
            longitude: 2.3522,
            timezone: 'Europe/Paris',
        };
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
        const config = proxy.config as IProxyToConnectConfigProxylocal;
        const proxyUrlOpts = urlToHttpOptions(config.url);

        if (!proxyUrlOpts) {
            throw new Error('Cannot parse proxy config.url');
        }

        if (urlOpts.ssl) {
            // HTTPS request
            return {
                method,
                hostname: proxyUrlOpts.hostname,
                port: proxyUrlOpts.port,
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
                    headersConnect[ 'Proxy-Authorization' ] = `Basic ${config.token}`;
                    headersConnect[ 'X-Proxylocal-Session-ID' ] = proxy.key;
                    headersConnect[ 'X-Proxylocal-Region' ] = config.region;

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
                            'TransportProxylocalService:https:buildRequestArgs'
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
                                'TransportProxylocalService:buildRequestArgs:createConnection:connect'
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
            headers[ 'Proxy-Authorization' ] = `Basic ${config.token}`;
            headers[ 'X-Proxylocal-Session-ID' ] = proxy.key;
            headers[ 'X-Proxylocal-Region' ] = config.region;

            return {
                method,
                hostname: proxyUrlOpts.hostname,
                port: proxyUrlOpts.port,
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
                    'TransportProxylocal:buildRequestArgs'
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
        const
            args = this.buildRequestArgs(
                method,
                urlOpts,
                headers,
                headersConnect,
                proxy,
                sockets,
                timeout
            ),
            config = proxy.config as IProxyToConnectConfigProxylocal;

        if (config.fingerprintForce) {
            headers[ 'X-Fingerprint' ] = btoa(JSON.stringify(config.fingerprintForce));
        }

        return args;
    }

    buildConnectArgs(
        url: string,
        headers: OutgoingHttpHeaders,
        proxy: IProxyToConnect,
        sockets: ISockets,
        timeout: number
    ): ClientRequestArgs {
        const config = proxy.config as IProxyToConnectConfigProxylocal;
        const proxyUrlOpts = urlToHttpOptions(config.url);

        if (!proxyUrlOpts) {
            throw new Error('Cannot parse proxy config.url');
        }

        headers[ 'Proxy-Authorization' ] = `Basic ${config.token}`;
        headers[ 'X-Proxylocal-Session-ID' ] = proxy.key;
        headers[ 'X-Proxylocal-Region' ] = config.region;

        return {
            method: 'CONNECT',
            hostname: proxyUrlOpts.hostname,
            port: proxyUrlOpts.port,
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
                'TransportProxylocal:buildConnectArgs'
            ),
        };
    }
}
