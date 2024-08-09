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
    SCRAPOXY_COOKIE_REGEX,
} from '@scrapoxy/backend-sdk';
import {
    AgentProxyHttpsTunnel,
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
    SCRAPOXY_COOKIE_PREFIX,
    SCRAPOXY_HEADER_PREFIX,
    SCRAPOXY_HEADER_PREFIX_LC,
} from '@scrapoxy/common';
import { Proxy } from '@scrapoxy/proxy-sdk';
import axios, { RawAxiosRequestHeaders } from 'axios';
import { v4 as uuid } from 'uuid';
import type { INestApplication } from '@nestjs/common';
import type { IProxyToConnectConfigDatacenter } from '@scrapoxy/backend-sdk';
import type {
    ICertificate,
    IProjectToConnect,
    IProxyToConnect,
} from '@scrapoxy/common';
import type { OutgoingHttpHeaders } from 'http';


function expectNotToExposeHeaders(rawHeaders: string[]) {
    const headers = new ArrayHttpHeaders(rawHeaders);

    expect(headers.getFirstHeader('proxy-authorization'))
        .toBeUndefined();

    expect(headers.getFirstHeaderWithPrefix(SCRAPOXY_HEADER_PREFIX_LC))
        .toBeUndefined();

    expect(headers.getFirstHeaderWithRegexValue(
        'cookie',
        SCRAPOXY_COOKIE_REGEX
    ))
        .toBeUndefined();
}


describe(
    'Master - Connections - Privacy',
    () => {
        const certificateProxy = generateCertificateSelfSignedForTest();
        const
            connectorId = uuid(),
            instance = axios.create({
                validateStatus: () => true,
            }),
            key = randomName(),
            proxyServer: Proxy = new Proxy(
                new Logger('Proxy'),
                ONE_MINUTE_IN_MS,
                certificateProxy.cert,
                certificateProxy.key
            ),
            servers = new TestServers();
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
                ciphers: null,
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
                        ciphersShuffle: false,
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
            'HTTP over HTTP requests',
            () => {
                it(
                    'should not have any Scrapoxy headers with sticky headers',
                    async() => {
                        const headers: RawAxiosRequestHeaders = {
                            'Proxy-Authorization': 'Basic fake_token',
                        };
                        headers[ `${SCRAPOXY_HEADER_PREFIX}-Proxyname` ] = proxy.id;

                        const res = await instance.get(
                            `${servers.urlHttp}/mirror/headers`,
                            {
                                headers,
                                proxy: {
                                    host: 'localhost',
                                    port,
                                    protocol: 'http',
                                },
                            }
                        );

                        expectNotToExposeHeaders(res.data);
                    }
                );

                it(
                    'should not have any Scrapoxy headers with sticky cookie',
                    async() => {
                        const res = await instance.get(
                            `${servers.urlHttp}/mirror/headers`,
                            {
                                headers: {
                                    'Proxy-Authorization': 'Basic fake_token',
                                    Cookie: `${SCRAPOXY_COOKIE_PREFIX}-proxyname=${proxy.id}`,
                                },
                                proxy: {
                                    host: 'localhost',
                                    port,
                                    protocol: 'http',
                                },
                            }
                        );

                        expectNotToExposeHeaders(res.data);
                    }
                );
            }
        );

        describe(
            'HTTPS over HTTP requests',
            () => {
                it(
                    'should not have any Scrapoxy headers with sticky headers',
                    async() => {
                        const headers: RawAxiosRequestHeaders = {
                            'Proxy-Authorization': 'Basic fake_token',
                        };
                        headers[ `${SCRAPOXY_HEADER_PREFIX}-Proxyname` ] = proxy.id;

                        const res = await instance.get(
                            `${servers.urlHttps}/mirror/headers`,
                            {
                                headers,
                                proxy: {
                                    host: 'localhost',
                                    port,
                                    protocol: 'http',
                                },
                            }
                        );

                        expectNotToExposeHeaders(res.data);
                    }
                );

                it(
                    'should not have any Scrapoxy headers with sticky cookie',
                    async() => {
                        const res = await instance.get(
                            `${servers.urlHttps}/mirror/headers`,
                            {
                                headers: {
                                    'Proxy-Authorization': 'Basic fake_token',
                                    Cookie: `${SCRAPOXY_COOKIE_PREFIX}-proxyname=${proxy.id}`,
                                },
                                proxy: {
                                    host: 'localhost',
                                    port,
                                    protocol: 'http',
                                },
                            }
                        );

                        expectNotToExposeHeaders(res.data);
                    }
                );
            }
        );

        describe(
            'HTTPS over HTTP tunnel requests (MITM mode)',
            () => {
                it(
                    'should not have any Scrapoxy headers with sticky headers',
                    async() => {
                        const headers: OutgoingHttpHeaders = {
                            'Proxy-Authorization': 'Basic fake_token',
                        };
                        headers[ `${SCRAPOXY_HEADER_PREFIX}-Proxyname` ] = proxy.id;

                        const httpsAgent = new AgentProxyHttpsTunnel({
                            hostname: 'localhost',
                            port,
                            ca,
                            headers,
                        });

                        try {
                            const res = await instance.get(
                                `${servers.urlHttps}/mirror/headers`,
                                {
                                    httpsAgent,
                                }
                            );

                            expectNotToExposeHeaders(res.data);
                        } finally {
                            httpsAgent.close();
                        }
                    }
                );

                it(
                    'should not have any Scrapoxy headers with sticky cookie',
                    async() => {
                        const httpsAgent = new AgentProxyHttpsTunnel({
                            hostname: 'localhost',
                            port,
                            ca,
                            headers: {
                                'Proxy-Authorization': 'Basic fake_token',
                                Cookie: `${SCRAPOXY_COOKIE_PREFIX}-proxyname=${proxy.id}`,
                            },
                        });

                        try {
                            const res = await instance.get(
                                `${servers.urlHttps}/mirror/headers`,
                                {
                                    httpsAgent,
                                }
                            );

                            expectNotToExposeHeaders(res.data);
                        } finally {
                            httpsAgent.close();
                        }
                    }
                );
            }
        );

        describe(
            'HTTPS over HTTP tunnel requests (tunnel mode)',
            () => {
                it(
                    'should not have any Scrapoxy headers with sticky headers',
                    async() => {
                        const headersConnect: OutgoingHttpHeaders = {
                            'Proxy-Authorization': 'Basic fake_token',
                        };
                        headersConnect[ `${SCRAPOXY_HEADER_PREFIX}-Mode` ] = 'tunnel';
                        headersConnect[ `${SCRAPOXY_HEADER_PREFIX}-Proxyname` ] = proxy.id;

                        const httpsAgent = new AgentProxyHttpsTunnel({
                            hostname: 'localhost',
                            port,
                            headers: headersConnect,
                        });

                        try {
                            const res = await instance.get(
                                `${servers.urlHttps}/mirror/headers`,
                                {
                                    httpsAgent,
                                }
                            );

                            expectNotToExposeHeaders(res.data);
                        } finally {
                            httpsAgent.close();
                        }
                    }
                );
            }
        );
    }
);
