import { Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
    CommanderMasterClientService,
    ConnectorDatacenterLocalModule,
    generateCertificateFromCaTest,
    generateCertificateSelfSignedForTest,
    MasterModule,
    MasterService,
    readCaCert,
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
    'Master - Connections - Parallel',
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
            requestsCount = 50,
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
                connectorId: connectorId,
                projectId: uuid(),
                type: CONNECTOR_DATACENTER_LOCAL_TYPE,
                key,
                config,
                useragent: generateUseragent(),
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
                        timeout: ONE_MINUTE_IN_MS,
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

        it(
            'should make multiple parallel requests without proxies',
            async() => {
                const promises: Promise<void>[] = [];
                for (let i = 0; i < requestsCount; ++i) {
                    promises.push(instance.get(
                        `${servers.urlHttp}/file/big`,
                        {
                            params: {
                                size: 1024,
                            },
                        }
                    ));
                }

                await Promise.all(promises);
            }
        );

        it(
            'should make multiple parallel requests with HTTP over HTTP',
            async() => {
                const promises: Promise<void>[] = [];
                for (let i = 0; i < requestsCount; ++i) {
                    promises.push(instance.get(
                        `${servers.urlHttp}/file/big`,
                        {
                            headers: {
                                'Proxy-Authorization': 'Basic fake_token',
                            },
                            params: {
                                size: 1024,
                            },
                            proxy: {
                                host: 'localhost',
                                port: port,
                                protocol: 'http',
                            },
                        }
                    ));
                }

                await Promise.all(promises);
            }
        );

        it(
            'should make multiple parallel requests with HTTPS over HTTP',
            async() => {
                const promises: Promise<void>[] = [];
                for (let i = 0; i < requestsCount; ++i) {
                    promises.push(instance.get(
                        `${servers.urlHttps}/file/big`,
                        {
                            headers: {
                                'Proxy-Authorization': 'Basic fake_token',
                            },
                            params: {
                                size: 1024,
                            },
                            proxy: {
                                host: 'localhost',
                                port: port,
                                protocol: 'http',
                            },
                        }
                    ));
                }

                await Promise.all(promises);
            }
        );

        it(
            'should make multiple parallel requests with HTTPS over HTTP tunnel (MITM mode)',
            async() => {
                const httpsAgent = new AgentProxyHttpsTunnel({
                    hostname: 'localhost',
                    port: port,
                    ca,
                });
                const promises: Promise<void>[] = [];
                for (let i = 0; i < requestsCount; ++i) {
                    promises.push(instance.get(
                        `${servers.urlHttp}/file/big`,
                        {
                            params: {
                                size: 1024,
                            },
                            httpsAgent,
                        }
                    ));
                }

                await Promise
                    .all(promises)
                    .finally(() => {
                        httpsAgent.close();
                    });
            }
        );

        it(
            'should make multiple parallel requests with HTTPS over HTTP tunnel (tunnel mode)',
            async() => {
                const headersConnect: OutgoingHttpHeaders = { };
                headersConnect[ `${SCRAPOXY_HEADER_PREFIX}-Mode` ] = 'tunnel';

                const httpsAgent = new AgentProxyHttpsTunnel({
                    hostname: 'localhost',
                    port: port,
                    headers: headersConnect,
                });
                const promises: Promise<void>[] = [];
                for (let i = 0; i < requestsCount; ++i) {
                    promises.push(instance.get(
                        `${servers.urlHttp}/file/big`,
                        {
                            params: {
                                size: 1024,
                            },
                            httpsAgent,
                        }
                    ));
                }

                await Promise
                    .all(promises)
                    .finally(() => {
                        httpsAgent.close();
                    });
            }
        );
    }
);
