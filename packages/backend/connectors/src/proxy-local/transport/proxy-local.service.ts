import {
    IncomingMessage,
    request,
} from 'http';
import { Socket } from 'net';
import { connect } from 'tls';
import { Injectable } from '@nestjs/common';
import {
    ATransportService,
    createConnectionAuto,
    HttpTransportError,
    isUrl,
    TransportprovidersService,
    urlOptionsToUrl,
    urlToUrlOptions,
} from '@scrapoxy/backend-sdk';
import { SCRAPOXY_HEADER_PREFIX_LC } from '@scrapoxy/common';
import { TRANSPORT_PROXY_LOCAL_TYPE } from './proxy-local.constants';
import type { IProxyToConnectConfigProxyLocal } from './proxy-local.interface';
import type {
    IConnectorProxyLocalConfig,
    IConnectorProxyLocalCredential,
} from '../proxy-local.interface';
import type {
    ArrayHttpHeaders,
    IUrlOptions,
} from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IConnectorToRefresh,
    IProxyToConnect,
    IProxyToRefresh,
} from '@scrapoxy/common';
import type { ISockets } from '@scrapoxy/proxy-sdk';
import type {
    ClientRequestArgs,
    OutgoingHttpHeaders,
} from 'http';
import type { ConnectionOptions } from 'tls';


@Injectable()
export class TransportProxyLocalService extends ATransportService {
    readonly type = TRANSPORT_PROXY_LOCAL_TYPE;

    constructor(transportproviders: TransportprovidersService) {
        super();

        transportproviders.register(this);
    }

    completeProxyConfig(
        proxy: IConnectorProxyRefreshed, connector: IConnectorToRefresh
    ) {
        const proxyConfig = proxy.config as IProxyToConnectConfigProxyLocal;
        const credentialConfig = connector.credentialConfig as IConnectorProxyLocalCredential;
        proxyConfig.token = credentialConfig.token;

        const connectorConfig = connector.connectorConfig as IConnectorProxyLocalConfig;
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
        urlOpts: IUrlOptions,
        headers: ArrayHttpHeaders,
        headersConnect: OutgoingHttpHeaders,
        proxy: IProxyToConnect,
        sockets: ISockets
    ): ClientRequestArgs {
        const config = proxy.config as IProxyToConnectConfigProxyLocal;
        const proxyUrlOpts = urlToUrlOptions(config.url);

        if (!proxyUrlOpts) {
            throw new Error('Cannot parse proxy config.url');
        }

        switch (urlOpts.protocol) {
            case 'http:': {
                return this.buildRequestArgsHttp(
                    method,
                    urlOpts,
                    headers,
                    proxy,
                    proxyUrlOpts,
                    config,
                    sockets
                );
            }

            case 'https:': {
                return this.buildRequestArgsHttps(
                    method,
                    urlOpts,
                    headers,
                    headersConnect,
                    proxy,
                    proxyUrlOpts,
                    config,
                    sockets
                );
            }

            default: {
                throw new Error(`Proxy local: Unsupported protocol ${urlOpts.protocol}`);
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
        const
            args = this.buildRequestArgs(
                method,
                urlOpts,
                headers,
                headersConnect,
                proxy,
                sockets
            ),
            config = proxy.config as IProxyToConnectConfigProxyLocal;

        if (config.fingerprintForce) {
            headers.addHeader(
                'X-Fingerprint',
                btoa(JSON.stringify(config.fingerprintForce))
            );
        }

        return args;
    }

    connect(
        url: string,
        headers: OutgoingHttpHeaders,
        proxy: IProxyToConnect,
        sockets: ISockets,
        callback: (err: Error, socket: Socket) => void
    ) {
        const config = proxy.config as IProxyToConnectConfigProxyLocal;
        const proxyUrlOpts = urlToUrlOptions(config.url);

        if (!proxyUrlOpts) {
            throw new Error('Cannot parse proxy config.url');
        }

        headers[ 'Proxy-Authorization' ] = `Basic ${config.token}`;
        headers[ 'X-Proxy-local-Session-ID' ] = proxy.key;
        headers[ 'X-Proxy-local-Region' ] = config.region;

        const proxyReq = request({
            method: 'CONNECT',
            hostname: proxyUrlOpts.hostname,
            port: proxyUrlOpts.port,
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
                'TransportProxyLocal:connect'
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

    private buildRequestArgsHttp(
        method: string | undefined,
        urlOpts: IUrlOptions,
        headers: ArrayHttpHeaders,
        proxy: IProxyToConnect,
        proxyUrlOpts: IUrlOptions,
        config: IProxyToConnectConfigProxyLocal,
        sockets: ISockets
    ): ClientRequestArgs {
        headers.addHeader(
            'Proxy-Authorization',
            `Basic ${config.token}`
        );
        headers.addHeader(
            'X-Proxy-local-Session-ID',
            proxy.key
        );
        headers.addHeader(
            'X-Proxy-local-Region',
            config.region
        );


        return {
            method,
            hostname: proxyUrlOpts.hostname,
            port: proxyUrlOpts.port,
            path: urlOptionsToUrl(
                urlOpts,
                true
            ),
            headers: headers.toArray() as any, // should accept also [string, string][]
            timeout: headers.parseKeepAliveTimeout(proxy.timeoutDisconnected),
            createConnection: (
                opts,
                oncreate
            ) => createConnectionAuto(
                opts,
                oncreate,
                sockets,
                'TransportProxyLocal:buildRequestArgs'
            ),
        };
    }

    private buildRequestArgsHttps(
        method: string | undefined,
        urlOpts: IUrlOptions,
        headers: ArrayHttpHeaders,
        headersConnect: OutgoingHttpHeaders,
        proxy: IProxyToConnect,
        proxyUrlOpts: IUrlOptions,
        config: IProxyToConnectConfigProxyLocal,
        sockets: ISockets
    ): ClientRequestArgs {
        return {
            method,
            hostname: proxyUrlOpts.hostname,
            port: proxyUrlOpts.port,
            path: urlOptionsToUrl(
                urlOpts,
                false
            ),
            headers: headers.toArray() as any, // should accept also [string, string][]
            timeout: headers.parseKeepAliveTimeout(proxy.timeoutDisconnected),
            createConnection: (
                args,
                oncreate
            ) => {
                headersConnect[ 'Proxy-Authorization' ] = `Basic ${config.token}`;
                headersConnect[ 'X-Proxy-Local-Session-ID' ] = proxy.key;
                headersConnect[ 'X-Proxy-Local-Region' ] = config.region;

                const proxyReqArgs: ClientRequestArgs = {
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
                        'TransportProxyLocalService:https:buildRequestArgs'
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
                            timeout: proxy.timeoutDisconnected,
                        };

                        if (isUrl(urlOpts.hostname)) {
                            options.servername = urlOpts.hostname as string;
                        }

                        if (proxy.ciphers) {
                            options.ciphers = proxy.ciphers;
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
                            'TransportProxyLocalService:buildRequestArgs:createConnection:connect'
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
