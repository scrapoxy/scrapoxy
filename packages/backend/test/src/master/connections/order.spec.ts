import { Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
    ConnectorDatacenterLocalModule,
    TRANSPORT_DATACENTER_LOCAL_TYPE,
} from '@scrapoxy/backend-connectors';
import {
    ArrayHttpHeaders,
    CommanderMasterClientService,
    generateCertificateFromCaTest,
    generateCertificateSelfSignedForTest,
    MasterModule,
    MasterService,
    readCaCert,
} from '@scrapoxy/backend-sdk';
import {
    EHttpRequestMode,
    HttpClient,
    TestServers,
    USERAGENT_TEST,
} from '@scrapoxy/backend-test-sdk';
import {
    CONNECTOR_DATACENTER_LOCAL_TYPE,
    EConnectMode,
    EProjectStatus,
    formatProxyId,
    generateUseragent,
    ONE_MINUTE_IN_MS,
    ONE_SECOND_IN_MS,
    PROXY_TIMEOUT_DISCONNECTED_DEFAULT_TEST,
    randomName,
    SCRAPOXY_HEADER_PREFIX,
} from '@scrapoxy/common';
import { Proxy } from '@scrapoxy/proxy-sdk';
import { v4 as uuid } from 'uuid';
import type { INestApplication } from '@nestjs/common';
import type { IProxyToConnectConfigDatacenter } from '@scrapoxy/backend-sdk';
import type {
    ICertificate,
    IProjectToConnect,
    IProxyToConnect,
} from '@scrapoxy/common';


describe(
    'Master - Connections - Headers order',
    () => {
        const certificateProxy = generateCertificateSelfSignedForTest();
        const
            client = new HttpClient(),
            connectorId = uuid(),
            key = randomName(),

            proxyServer: Proxy = new Proxy(
                new Logger('Proxy'),
                ONE_MINUTE_IN_MS,
                certificateProxy.cert,
                certificateProxy.key
            ),
            reqHeaders = new ArrayHttpHeaders()
                .addHeader(
                    'Accept',
                    '*/*'
                )
                .addHeader(
                    'accept',
                    '*/*'
                )
                .addHeader(
                    'aCCept',
                    '*/*'
                ),
            servers = new TestServers();
        const reqHeadersArray = reqHeaders.toArray();
        let
            app: INestApplication,
            ca: string,
            certificateMitm: ICertificate,
            master: MasterService,
            port: number,
            proxy: IProxyToConnect;

        beforeAll(async() => {
            // Get certificates
            ca = await readCaCert();
            certificateMitm = await generateCertificateFromCaTest();

            // Start target and proxy
            await Promise.all([
                servers.listen(), proxyServer.listen(),
            ]);

            const config: IProxyToConnectConfigDatacenter = {
                address: {
                    hostname: 'localhost',
                    port: proxyServer.port as number,
                },
                certificate: certificateProxy,
            };

            proxy = {
                id: formatProxyId(
                    connectorId,
                    key
                ),
                type: CONNECTOR_DATACENTER_LOCAL_TYPE,
                transportType: TRANSPORT_DATACENTER_LOCAL_TYPE,
                connectorId,
                projectId: uuid(),
                key,
                config,
                useragent: generateUseragent(),
                timeoutDisconnected: PROXY_TIMEOUT_DISCONNECTED_DEFAULT_TEST,
            };

            // Start master
            const fakeConfig = {
                url: 'http://unused_url',
                useragent: USERAGENT_TEST,
                jwt: {
                    secret: 'unused_secret',
                    expiration: '60s',
                },
                delay: 10 * ONE_SECOND_IN_MS,
            };
            const moduleRef = await Test.createTestingModule({
                imports: [
                    ConnectorDatacenterLocalModule.forRoot({
                        url: fakeConfig.url,
                    }),
                    MasterModule.forRoot({
                        port: 0,
                        certificate: void 0,
                        master: fakeConfig,
                        refreshMetrics: fakeConfig,
                        trackSockets: true,
                    }),
                ],
            })
                .overrideProvider(CommanderMasterClientService)
                .useValue({
                    getProjectToConnect: async(
                        token: string, mode: EConnectMode
                    ): Promise<IProjectToConnect> => ({
                        id: proxy.projectId,
                        autoScaleUp: true,
                        certificate: mode !== EConnectMode.TUNNEL ? certificateMitm : null,
                        cookieSession: true,
                        status: EProjectStatus.HOT,
                        useragentOverride: false,
                    }),
                    getNextProxyToConnect: async(): Promise<IProxyToConnect> => proxy,
                })
                .compile();

            app = moduleRef.createNestApplication();

            await app.listen(0);
            master = app.get<MasterService>(MasterService);
            port = master.port as number;
        });


        afterAll(async() => {
            await Promise.all([
                app.close(), proxyServer.close(), servers.close(),
            ]);
        });

        describe(
            'Direct requests',
            () => {
                it(
                    'should have the same headers order and content for HTTP request',
                    async() => {
                        const res = await client.request({
                            url: `${servers.urlHttp}/mirror/headers`,
                            headers: reqHeaders.clone(),
                        });

                        expect(res.status)
                            .toBe(200);

                        const resHeadersArray = new ArrayHttpHeaders(res.data)
                            .toArray()
                            .slice(
                                0,
                                reqHeadersArray.length
                            );

                        expect(resHeadersArray)
                            .toEqual(reqHeadersArray);
                    }
                );

                it(
                    'should have the same headers order and content for HTTPS request',
                    async() => {
                        const res = await client.request({
                            url: `${servers.urlHttps}/mirror/headers`,
                            headers: reqHeaders.clone(),
                        });

                        expect(res.status)
                            .toBe(200);

                        const resHeadersArray = new ArrayHttpHeaders(res.data)
                            .toArray()
                            .slice(
                                0,
                                reqHeadersArray.length
                            );

                        expect(resHeadersArray)
                            .toEqual(reqHeadersArray);
                    }
                );
            }
        );

        describe(
            'HTTP over HTTP requests',
            () => {
                it(
                    'should have the same headers order and content',
                    async() => {
                        const reqHeadersProxy = reqHeaders
                            .clone()
                            .addHeader(
                                'Proxy-Authorization',
                                'Basic fake_token'
                            );
                        const res = await client.request({
                            url: `${servers.urlHttp}/mirror/headers`,
                            headers: reqHeadersProxy,
                            proxy: {
                                host: 'localhost',
                                port,
                            },
                        });

                        expect(res.status)
                            .toBe(200);

                        const resHeadersArray = new ArrayHttpHeaders(res.data)
                            .toArray()
                            .slice(
                                0,
                                reqHeadersArray.length
                            );

                        expect(resHeadersArray)
                            .toEqual(reqHeadersArray);
                    }
                );
            }
        );

        describe(
            'HTTPS over HTTP requests',
            () => {
                it(
                    'should have the same headers order and content',
                    async() => {
                        const reqHeadersProxy = reqHeaders
                            .clone()
                            .addHeader(
                                'Proxy-Authorization',
                                'Basic fake_token'
                            );
                        const res = await client.request({
                            url: `${servers.urlHttps}/mirror/headers`,
                            headers: reqHeadersProxy,
                            proxy: {
                                host: 'localhost',
                                port,
                            },
                        });

                        expect(res.status)
                            .toBe(200);

                        const resHeadersArray = new ArrayHttpHeaders(res.data)
                            .toArray()
                            .slice(
                                0,
                                reqHeadersArray.length
                            );

                        expect(resHeadersArray)
                            .toEqual(reqHeadersArray);
                    }
                );
            }
        );

        describe(
            'HTTPS over HTTP tunnel requests (MITM mode)',
            () => {
                it(
                    'should have the same headers order and content',
                    async() => {
                        const res = await client.request({
                            url: `${servers.urlHttps}/mirror/headers`,
                            headers: reqHeaders.clone(),
                            proxy: {
                                mode: EHttpRequestMode.MITM,
                                host: 'localhost',
                                port,
                                ca,
                                headers: {
                                    'Proxy-Authorization': 'Basic fake_token',
                                },
                            },
                        });

                        expect(res.status)
                            .toBe(200);

                        const resHeadersArray = new ArrayHttpHeaders(res.data)
                            .toArray()
                            .slice(
                                0,
                                reqHeadersArray.length
                            );

                        expect(resHeadersArray)
                            .toEqual(reqHeadersArray);
                    }
                );
            }
        );

        describe(
            'HTTPS over HTTP tunnel requests (tunnel mode)',
            () => {
                it(
                    'should have the same headers order and content',
                    async() => {
                        const res = await client.request({
                            url: `${servers.urlHttps}/mirror/headers`,
                            headers: reqHeaders.clone(),
                            proxy: {
                                mode: EHttpRequestMode.TUNNEL,
                                host: 'localhost',
                                port,
                                headers: new ArrayHttpHeaders()
                                    .addHeader(
                                        'Proxy-Authorization',
                                        'Basic fake_token'
                                    )
                                    .addHeader(
                                        `${SCRAPOXY_HEADER_PREFIX}-Mode`,
                                        'tunnel'
                                    ),
                            },
                        });

                        expect(res.status)
                            .toBe(200);

                        const resHeadersArray = new ArrayHttpHeaders(res.data)
                            .toArray()
                            .slice(
                                0,
                                reqHeadersArray.length
                            );

                        expect(resHeadersArray)
                            .toEqual(reqHeadersArray);
                    }
                );
            }
        );
    }
);
