import { Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConnectorDatacenterLocalModule } from '@scrapoxy/backend-connectors';
import {
    CommanderMasterClientService,
    generateCertificateSelfSignedForTest,
    MasterModule,
    MasterService,
} from '@scrapoxy/backend-sdk';
import {
    AgentProxyHttpsTunnel,
    generateData,
    GeneratorCheckStream,
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
import axios from 'axios';
import { v4 as uuid } from 'uuid';
import type { INestApplication } from '@nestjs/common';
import type { IProxyToConnectConfigDatacenter } from '@scrapoxy/backend-sdk';
import type {
    ICertificate,
    IProjectToConnect,
    IProxyToConnect,
} from '@scrapoxy/common';
import type { OutgoingHttpHeaders } from 'http';


describe(
    'Master - Transfer big file',
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
            servers = new TestServers(),
            size = 1024 * 1024;
        let
            app: INestApplication,
            ca: string,
            certificateMitm: ICertificate,
            port: number,
            proxy: IProxyToConnect;

        beforeAll(async() => {
            // Get certificates

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
                connectorId,
                projectId: uuid(),
                type: CONNECTOR_DATACENTER_LOCAL_TYPE,
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
            port = app.get<MasterService>(MasterService).port as number;
        });

        afterAll(async() => {
            await Promise.all([
                app.close(), proxyServer.close(), servers.close(),
            ]);
        });

        describe(
            'Download',
            () => {
                it(
                    'should download with HTTP over HTTP proxy',
                    async() => {
                        const res = await instance.get(
                            `${servers.urlHttp}/file/big`,
                            {
                                headers: {
                                    'Proxy-Authorization': 'Basic fake_token',
                                },
                                params: {
                                    size,
                                },
                                responseType: 'stream',
                                proxy: {
                                    host: 'localhost',
                                    port: port,
                                    protocol: 'http',
                                },
                            }
                        );

                        expect(res.status)
                            .toBe(200);

                        await GeneratorCheckStream.from(
                            res.data,
                            {
                                maxSize: size,
                            }
                        );
                    }
                );

                it(
                    'should download with HTTPS over HTTP',
                    async() => {
                        const res = await instance.get(
                            `${servers.urlHttps}/file/big`,
                            {
                                headers: {
                                    'Proxy-Authorization': 'Basic fake_token',
                                },
                                params: {
                                    size,
                                },
                                responseType: 'stream',
                                proxy: {
                                    host: 'localhost',
                                    port: port,
                                    protocol: 'http',
                                },
                            }
                        );

                        expect(res.status)
                            .toBe(200);

                        await GeneratorCheckStream.from(
                            res.data,
                            {
                                maxSize: size,
                            }
                        );
                    }
                );

                it(
                    'should download with HTTPS over HTTP tunnel (MITM mode)',
                    async() => {
                        const httpsAgent = new AgentProxyHttpsTunnel({
                            hostname: 'localhost',
                            port: port,
                            ca,
                            headers: {
                                'Proxy-Authorization': 'Basic fake_token',
                            },
                        });

                        try {
                            const res = await instance.get(
                                `${servers.urlHttps}/file/big`,
                                {
                                    params: {
                                        size,
                                    },
                                    responseType: 'stream',
                                    httpsAgent,
                                }
                            );

                            expect(res.status)
                                .toBe(200);

                            await GeneratorCheckStream.from(
                                res.data,
                                {
                                    maxSize: size,
                                }
                            );
                        } finally {
                            httpsAgent.close();
                        }
                    }
                );

                it(
                    'should download with HTTPS over HTTP tunnel (tunnel mode)',
                    async() => {
                        const headersConnect: OutgoingHttpHeaders = {
                            'Proxy-Authorization': 'Basic fake_token',
                        };
                        headersConnect[ `${SCRAPOXY_HEADER_PREFIX}-Mode` ] = 'tunnel';

                        const httpsAgent = new AgentProxyHttpsTunnel({
                            hostname: 'localhost',
                            port: port,
                            headers: headersConnect,
                        });

                        try {
                            const res = await instance.get(
                                `${servers.urlHttps}/file/big`,
                                {
                                    params: {
                                        size,
                                    },
                                    responseType: 'stream',
                                    httpsAgent,
                                }
                            );

                            expect(res.status)
                                .toBe(200);

                            await GeneratorCheckStream.from(
                                res.data,
                                {
                                    maxSize: size,
                                }
                            );
                        } finally {
                            httpsAgent.close();
                        }
                    }
                );
            }
        );

        describe(
            'Upload',
            () => {
                it(
                    'should upload with HTTP over HTTP proxy',
                    async() => {
                        const res = await instance.post(
                            `${servers.urlHttp}/file/big`,
                            generateData(size),
                            {
                                params: {
                                    size,
                                },
                                headers: {
                                    'Proxy-Authorization': 'Basic fake_token',
                                    'Content-Type': 'application/octet-stream',
                                    'Content-Length': size.toString(),
                                },
                                proxy: {
                                    host: 'localhost',
                                    port: port,
                                    protocol: 'http',
                                },
                            }
                        );

                        expect(res.status)
                            .toBe(200);
                    }
                );

                it(
                    'should upload with HTTPS over HTTP',
                    async() => {
                        const res = await instance.post(
                            `${servers.urlHttps}/file/big`,
                            generateData(size),
                            {
                                params: {
                                    size,
                                },
                                headers: {
                                    'Proxy-Authorization': 'Basic fake_token',
                                    'Content-Type': 'application/octet-stream',
                                    'Content-Length': size.toString(),
                                },
                                proxy: {
                                    host: 'localhost',
                                    port: port,
                                    protocol: 'http',
                                },
                            }
                        );

                        expect(res.status)
                            .toBe(200);
                    }
                );

                it(
                    'should upload with HTTPS over HTTP tunnel (MITM mode)',
                    async() => {
                        const httpsAgent = new AgentProxyHttpsTunnel({
                            hostname: 'localhost',
                            port: port,
                            ca,
                            headers: {
                                'Proxy-Authorization': 'Basic fake_token',
                            },
                        });

                        try {
                            const res = await instance.post(
                                `${servers.urlHttps}/file/big`,
                                generateData(size),
                                {
                                    params: {
                                        size,
                                    },
                                    headers: {
                                        'Content-Type': 'application/octet-stream',
                                        'Content-Length': size.toString(),
                                    },
                                    httpsAgent,
                                }
                            );

                            expect(res.status)
                                .toBe(200);
                        } finally {
                            httpsAgent.close();
                        }
                    }
                );

                it(
                    'should upload with HTTPS over HTTP tunnel (tunnel mode)',
                    async() => {
                        const headersConnect: OutgoingHttpHeaders = {
                            'Proxy-Authorization': 'Basic fake_token',
                        };
                        headersConnect[ `${SCRAPOXY_HEADER_PREFIX}-Mode` ] = 'tunnel';

                        const httpsAgent = new AgentProxyHttpsTunnel({
                            hostname: 'localhost',
                            port: port,
                            headers: headersConnect,
                        });

                        try {
                            const res = await instance.post(
                                `${servers.urlHttps}/file/big`,
                                generateData(size),
                                {
                                    params: {
                                        size,
                                    },
                                    headers: {
                                        'Content-Type': 'application/octet-stream',
                                        'Content-Length': size.toString(),
                                    },
                                    httpsAgent,
                                }
                            );

                            expect(res.status)
                                .toBe(200);
                        } finally {
                            httpsAgent.close();
                        }
                    }
                );
            }
        );
    }
);
