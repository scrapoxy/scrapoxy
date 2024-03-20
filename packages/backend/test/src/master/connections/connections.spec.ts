import { Agent } from 'https';
import { Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConnectorDatacenterLocalModule } from '@scrapoxy/backend-connectors';
import {
    CommanderMasterClientService,
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
    waitFor,
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
    SCRAPOXY_HEADER_PREFIX_LC,
    sleep,
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
    'Master - Connections',
    () => {
        const certificateProxy = generateCertificateSelfSignedForTest();
        const
            connectorId = uuid(),
            instance = axios.create({
                validateStatus: () => true,
            }),
            key = randomName(),
            postData = {
                firstName: 'john',
                lastName: 'doe',
            },
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
            'Direct connection',
            () => {
                it(
                    'should have a direct HTTP connection',
                    async() => {
                        const res = await instance.get(`${servers.urlHttp}/mirror/headers`);

                        expect(res.status)
                            .toBe(200);
                    }
                );

                it(
                    'should have a direct HTTPS connection',
                    async() => {
                        const res = await instance.get(
                            `${servers.urlHttps}/mirror/headers`,
                            {
                                httpsAgent: new Agent({
                                    requestCert: true,
                                    rejectUnauthorized: false,
                                }),
                            }
                        );

                        expect(res.status)
                            .toBe(200);
                    }
                );
            }
        );

        describe(
            'HTTP over HTTP requests',
            () => {
                it(
                    'should have a socket hang up if remote socket is destroyed',
                    async() => {
                        const res = await instance.get(
                            `${servers.urlHttp}/socketdestroy`,
                            {
                                headers: {
                                    'Proxy-Authorization': 'Basic fake_token',
                                },
                                proxy: {
                                    host: 'localhost',
                                    port,
                                    protocol: 'http',
                                },
                            }
                        );

                        expect(res.status)
                            .toBe(500);
                        expect(res.statusText)
                            .toBe('request_error');
                        expect(res.data.id)
                            .toBe('request_error');
                        expect(res.data.message)
                            .toBe('socket hang up');
                        expect(res.data.proxyId)
                            .toBe(proxy.id);
                        expect(res.headers)
                            .toHaveProperty(
                                `${SCRAPOXY_HEADER_PREFIX_LC}-proxyname`,
                                proxy.id
                            );
                    }
                );

                it(
                    'should have a socket hang up if using wrong protocol',
                    async() => {
                        const res = await instance.post(
                            // This is a HTTP request on a HTTPS port
                            `http://localhost:${servers.portHttps}/mirror/payload`,
                            postData,
                            {
                                headers: {
                                    'Proxy-Authorization': 'Basic fake_token',
                                },
                                proxy: {
                                    host: 'localhost',
                                    port,
                                    protocol: 'http',
                                },
                            }
                        );

                        expect(res.status)
                            .toBe(500);
                        expect(res.statusText)
                            .toBe('request_error');
                        expect(res.data.id)
                            .toBe('request_error');
                        expect(res.data.message)
                            .toBe('socket hang up');
                        expect(res.data.proxyId)
                            .toBe(proxy.id);
                        expect(res.headers)
                            .toHaveProperty(
                                `${SCRAPOXY_HEADER_PREFIX_LC}-proxyname`,
                                proxy.id
                            );
                    }
                );

                it(
                    'should handle timeout',
                    async() => {
                        try {
                            await expect(instance.post(
                                `${servers.urlHttps}/mirror/headers`,
                                postData,
                                {
                                    headers: {
                                        'Proxy-Authorization': 'Basic fake_token',
                                    },
                                    proxy: {
                                        host: 'localhost',
                                        port,
                                        protocol: 'http',
                                    },
                                    timeout: 1,
                                }
                            ))
                                .rejects
                                .toThrow('timeout');
                        } finally {
                            // Lets the server close the socket
                            await sleep(500);
                        }
                    }
                );

                it(
                    'should refuse connection if connects on a closed port',
                    async() => {
                        const res = await instance.get(
                            `http://localhost:${servers.portHttp - 100}/mirror/headers`,
                            {
                                headers: {
                                    'Proxy-Authorization': 'Basic fake_token',
                                },
                                proxy: {
                                    host: 'localhost',
                                    port,
                                    protocol: 'http',
                                },
                            }
                        );

                        expect(res.status)
                            .toBe(500);
                        expect(res.statusText)
                            .toBe('request_error');
                        expect(res.data.id)
                            .toBe('request_error');
                        expect(res.data.message)
                            .toEqual(expect.stringContaining('ECONNREFUSED'));
                        expect(res.data.proxyId)
                            .toBe(proxy.id);
                        expect(res.headers)
                            .toHaveProperty(
                                `${SCRAPOXY_HEADER_PREFIX_LC}-proxyname`,
                                proxy.id
                            );
                    }
                );

                it(
                    'should request GET',
                    async() => {
                        const res = await instance.get(
                            `${servers.urlHttp}/mirror/headers`,
                            {
                                headers: {
                                    'Proxy-Authorization': 'Basic fake_token',
                                },
                                proxy: {
                                    host: 'localhost',
                                    port,
                                    protocol: 'http',
                                },
                            }
                        );

                        expect(res.status)
                            .toBe(200);
                        expect(res.statusText)
                            .toBe('OK');
                        expect(res.headers)
                            .toHaveProperty(
                                `${SCRAPOXY_HEADER_PREFIX_LC}-proxyname`,
                                proxy.id
                            );
                    }
                );

                it(
                    'should request POST',
                    async() => {
                        const res = await instance.post(
                            `${servers.urlHttp}/mirror/payload`,
                            postData,
                            {
                                headers: {
                                    'Proxy-Authorization': 'Basic fake_token',
                                },
                                proxy: {
                                    host: 'localhost',
                                    port,
                                    protocol: 'http',
                                },
                            }
                        );

                        expect(res.status)
                            .toBe(200);
                        expect(res.statusText)
                            .toBe('OK');
                        expect(res.data)
                            .toEqual(postData);
                        expect(res.headers)
                            .toHaveProperty(
                                `${SCRAPOXY_HEADER_PREFIX_LC}-proxyname`,
                                proxy.id
                            );
                    }
                );

                it(
                    'should not make a unknown protocol request',
                    async() => {
                        const res = await instance.get(
                            'file://c:/windows/win.ini',
                            {
                                headers: {
                                    'Proxy-Authorization': 'Basic fake_token',
                                },
                                proxy: {
                                    host: 'localhost',
                                    port,
                                    protocol: 'http',
                                },
                            }
                        );

                        expect(res.status)
                            .toBe(500);
                        expect(res.data.message)
                            .toContain('Unsupported protocol: file:');
                    }
                );
            }
        );

        describe(
            'HTTPS over HTTP requests',
            () => {
                it(
                    'should have a socket hang up if remote socket is destroyed',
                    async() => {
                        const res = await instance.get(
                            `${servers.urlHttps}/socketdestroy`,
                            {
                                headers: {
                                    'Proxy-Authorization': 'Basic fake_token',
                                },
                                proxy: {
                                    host: 'localhost',
                                    port,
                                    protocol: 'http',
                                },
                            }
                        );

                        expect(res.status)
                            .toBe(500);
                        expect(res.statusText)
                            .toBe('request_error');
                        expect(res.data.id)
                            .toBe('request_error');
                        expect(res.data.message)
                            .toBe('socket hang up');
                        expect(res.data.proxyId)
                            .toBe(proxy.id);
                        expect(res.headers)
                            .toHaveProperty(
                                `${SCRAPOXY_HEADER_PREFIX_LC}-proxyname`,
                                proxy.id
                            );
                    }
                );

                it(
                    'should have a socket hang up if using wrong protocol',
                    async() => {
                        const res = await instance.post(
                            // This is a HTTPS request on a HTTP port
                            `https://localhost:${servers.portHttp}/mirror/payload`,
                            postData,
                            {
                                headers: {
                                    'Proxy-Authorization': 'Basic fake_token',
                                },
                                proxy: {
                                    host: 'localhost',
                                    port,
                                    protocol: 'http',
                                },
                            }
                        );

                        expect(res.status)
                            .toBe(500);
                        expect(res.statusText)
                            .toBe('request_error');
                        expect(res.data.id)
                            .toBe('request_error');
                        expect(res.data.message)
                            .toEqual(expect.stringContaining('routines:ssl3_get_record:wrong version'));
                        expect(res.data.proxyId)
                            .toBe(proxy.id);
                        expect(res.headers)
                            .toHaveProperty(
                                `${SCRAPOXY_HEADER_PREFIX_LC}-proxyname`,
                                proxy.id
                            );
                    }
                );

                it(
                    'should handle timeout',
                    async() => {
                        try {
                            await expect(instance.post(
                                `${servers.urlHttps}/mirror/headers`,
                                postData,
                                {
                                    headers: {
                                        'Proxy-Authorization': 'Basic fake_token',
                                    },
                                    proxy: {
                                        host: 'localhost',
                                        port,
                                        protocol: 'http',
                                    },
                                    timeout: 1,
                                }
                            ))
                                .rejects
                                .toThrow('timeout');
                        } finally {
                            // Lets the server close the socket
                            await sleep(500);
                        }
                    }
                );

                it(
                    'should refuse connection if connects on a closed port',
                    async() => {
                        const res = await instance.get(
                            // This is a HTTP request on a closed HTTP port
                            `https://localhost:${servers.portHttps - 100}/mirror/headers`,
                            {
                                headers: {
                                    'Proxy-Authorization': 'Basic fake_token',
                                },
                                proxy: {
                                    host: 'localhost',
                                    port,
                                    protocol: 'http',
                                },
                            }
                        );

                        expect(res.status)
                            .toBe(500);
                        expect(res.statusText)
                            .toBe('request_error');
                        expect(res.data.id)
                            .toBe('request_error');
                        expect(res.data.message)
                            .toEqual(expect.stringContaining('ECONNREFUSED'));
                        expect(res.data.proxyId)
                            .toBe(proxy.id);
                        expect(res.headers)
                            .toHaveProperty(
                                `${SCRAPOXY_HEADER_PREFIX_LC}-proxyname`,
                                proxy.id
                            );
                    }
                );

                it(
                    'should request GET',
                    async() => {
                        const res = await instance.get(
                            `${servers.urlHttps}/mirror/headers`,
                            {
                                headers: {
                                    'Proxy-Authorization': 'Basic fake_token',
                                },
                                proxy: {
                                    host: 'localhost',
                                    port,
                                    protocol: 'http',
                                },
                            }
                        );

                        expect(res.status)
                            .toBe(200);
                        expect(res.statusText)
                            .toBe('OK');
                        expect(res.headers)
                            .toHaveProperty(
                                `${SCRAPOXY_HEADER_PREFIX_LC}-proxyname`,
                                proxy.id
                            );
                    }
                );

                it(
                    'should request POST',
                    async() => {
                        const res = await instance.post(
                            `${servers.urlHttps}/mirror/payload`,
                            postData,
                            {
                                headers: {
                                    'Proxy-Authorization': 'Basic fake_token',
                                },
                                proxy: {
                                    host: 'localhost',
                                    port,
                                    protocol: 'http',
                                },
                            }
                        );

                        expect(res.status)
                            .toBe(200);
                        expect(res.statusText)
                            .toBe('OK');
                        expect(res.data)
                            .toEqual(postData);
                        expect(res.headers)
                            .toHaveProperty(
                                `${SCRAPOXY_HEADER_PREFIX_LC}-proxyname`,
                                proxy.id
                            );
                    }
                );
            }
        );

        describe(
            'HTTPS over HTTP tunnel requests (MITM mode)',
            () => {
                it(
                    'should have a socket hang up if remote socket is destroyed',
                    async() => {
                        const httpsAgent = new AgentProxyHttpsTunnel({
                            hostname: 'localhost',
                            port,
                            ca,
                            headers: {
                                'Proxy-Authorization': 'Basic fake_token',
                            },
                        });

                        try {
                            const res = await instance.get(
                                `${servers.urlHttps}/socketdestroy`,
                                {
                                    httpsAgent,
                                }
                            );

                            expect(res.status)
                                .toBe(500);
                            expect(res.statusText)
                                .toBe('request_error');
                            expect(res.data.id)
                                .toBe('request_error');
                            expect(res.data.message)
                                .toBe('socket hang up');
                            expect(res.data.proxyId)
                                .toBe(proxy.id);
                            expect(res.headers)
                                .toHaveProperty(
                                    `${SCRAPOXY_HEADER_PREFIX_LC}-proxyname`,
                                    proxy.id
                                );

                            expect(httpsAgent.headers)
                                .toEqual({});
                        } finally {
                            httpsAgent.close();
                        }
                    }
                );

                it(
                    'should have a wrong version number error if using wrong protocol',
                    async() => {
                        const httpsAgent = new AgentProxyHttpsTunnel({
                            hostname: 'localhost',
                            port,
                            ca,
                            headers: {
                                'Proxy-Authorization': 'Basic fake_token',
                            },
                        });

                        try {
                            const res = await instance.post(
                                // This is a HTTPS request on a HTTP port
                                `https://localhost:${servers.portHttp}/mirror/payload`,
                                postData,
                                {
                                    httpsAgent,
                                }
                            );

                            expect(res.status)
                                .toBe(500);
                            expect(res.statusText)
                                .toBe('request_error');
                            expect(res.data.id)
                                .toBe('request_error');
                            expect(res.data.message)
                                .toEqual(expect.stringContaining('routines:ssl3_get_record:wrong version'));
                            expect(res.data.proxyId)
                                .toBe(proxy.id);
                            expect(res.headers)
                                .toHaveProperty(
                                    `${SCRAPOXY_HEADER_PREFIX_LC}-proxyname`,
                                    proxy.id
                                );

                            expect(httpsAgent.headers)
                                .toEqual({});
                        } finally {
                            httpsAgent.close();
                        }
                    }
                );

                it(
                    'should handle timeout',
                    async() => {
                        const httpsAgent = new AgentProxyHttpsTunnel({
                            hostname: 'localhost',
                            port,
                            ca,
                            headers: {
                                'Proxy-Authorization': 'Basic fake_token',
                            },
                        });

                        try {
                            await expect(instance.post(
                                `${servers.urlHttps}/mirror/payload`,
                                postData,
                                {
                                    httpsAgent,
                                    timeout: 1,
                                }
                            ))
                                .rejects
                                .toThrow('timeout');
                        } finally {
                            httpsAgent.close();

                            // Lets the server close the socket
                            await sleep(500);
                        }
                    }
                );

                it(
                    'should refuse connection if connects on a closed port',
                    async() => {
                        const httpsAgent = new AgentProxyHttpsTunnel({
                            hostname: 'localhost',
                            port,
                            ca,
                            headers: {
                                'Proxy-Authorization': 'Basic fake_token',
                            },
                        });

                        try {
                            const res = await instance.post(
                                // This is a HTTP request on a closed HTTP port
                                `https://localhost:${servers.portHttps - 100}/mirror/payload`,
                                postData,
                                {
                                    httpsAgent,
                                }
                            );

                            expect(res.status)
                                .toBe(500);
                            expect(res.statusText)
                                .toBe('request_error');
                            expect(res.data.id)
                                .toBe('request_error');
                            expect(res.data.message)
                                .toEqual(expect.stringContaining('ECONNREFUSED'));
                            expect(res.data.proxyId)
                                .toBe(proxy.id);
                            expect(res.headers)
                                .toHaveProperty(
                                    `${SCRAPOXY_HEADER_PREFIX_LC}-proxyname`,
                                    proxy.id
                                );

                            expect(httpsAgent.headers)
                                .toEqual({});
                        } finally {
                            httpsAgent.close();
                        }
                    }
                );

                it(
                    'should request GET',
                    async() => {
                        const httpsAgent = new AgentProxyHttpsTunnel({
                            hostname: 'localhost',
                            port,
                            ca,
                            headers: {
                                'Proxy-Authorization': 'Basic fake_token',
                            },
                        });

                        try {
                            const res = await instance.get(
                                `${servers.urlHttps}/mirror/headers`,
                                {
                                    httpsAgent,
                                }
                            );

                            expect(res.status)
                                .toBe(200);
                            expect(res.statusText)
                                .toBe('OK');
                            expect(res.headers)
                                .toHaveProperty(
                                    `${SCRAPOXY_HEADER_PREFIX_LC}-proxyname`,
                                    proxy.id
                                );

                            expect(httpsAgent.headers)
                                .toEqual({});
                        } finally {
                            httpsAgent.close();
                        }
                    }
                );

                it(
                    'should request POST',
                    async() => {
                        const httpsAgent = new AgentProxyHttpsTunnel({
                            hostname: 'localhost',
                            port,
                            ca,
                            headers: {
                                'Proxy-Authorization': 'Basic fake_token',
                            },
                        });

                        try {
                            const res = await instance.post(
                                `${servers.urlHttps}/mirror/payload`,
                                postData,
                                {
                                    httpsAgent,
                                }
                            );

                            expect(res.status)
                                .toBe(200);
                            expect(res.statusText)
                                .toBe('OK');
                            expect(res.data)
                                .toEqual(postData);
                            expect(res.headers)
                                .toHaveProperty(
                                    `${SCRAPOXY_HEADER_PREFIX_LC}-proxyname`,
                                    proxy.id
                                );

                            expect(httpsAgent.headers)
                                .toEqual({});
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
                    'should have a socket hang up if remote socket is destroyed',
                    async() => {
                        const headersConnect: OutgoingHttpHeaders = {
                            'Proxy-Authorization': 'Basic fake_token',
                        };
                        headersConnect[ `${SCRAPOXY_HEADER_PREFIX}-Mode` ] = 'tunnel';

                        const httpsAgent = new AgentProxyHttpsTunnel({
                            hostname: 'localhost',
                            port,
                            headers: headersConnect,
                        });

                        try {
                            await expect(instance.get(
                                `${servers.urlHttps}/socketdestroy`,
                                {
                                    httpsAgent,
                                }
                            )).rejects.toThrow('socket hang up');

                            expect(httpsAgent.headers)
                                .toHaveProperty(
                                    `${SCRAPOXY_HEADER_PREFIX_LC}-proxyname`,
                                    proxy.id
                                );
                        } finally {
                            httpsAgent.close();
                        }
                    }
                );

                it(
                    'should have a wrong version number error if using wrong protocol',
                    async() => {
                        const headersConnect: OutgoingHttpHeaders = {
                            'Proxy-Authorization': 'Basic fake_token',
                        };
                        headersConnect[ `${SCRAPOXY_HEADER_PREFIX}-Mode` ] = 'tunnel';

                        const httpsAgent = new AgentProxyHttpsTunnel({
                            hostname: 'localhost',
                            port,
                            headers: headersConnect,
                        });

                        try {
                            await expect(instance.post(
                                // This is a HTTPS request on a HTTP port
                                `https://localhost:${servers.portHttp}/mirror/payload`,
                                postData,
                                {
                                    httpsAgent,
                                }
                            )).rejects.toThrow('routines:ssl3_get_record:wrong version');

                            expect(httpsAgent.headers)
                                .toHaveProperty(
                                    `${SCRAPOXY_HEADER_PREFIX_LC}-proxyname`,
                                    proxy.id
                                );
                        } finally {
                            httpsAgent.close();
                        }
                    }
                );

                it(
                    'should handle timeout',
                    async() => {
                        const headersConnect: OutgoingHttpHeaders = {
                            'Proxy-Authorization': 'Basic fake_token',
                        };
                        headersConnect[ `${SCRAPOXY_HEADER_PREFIX}-Mode` ] = 'tunnel';

                        const httpsAgent = new AgentProxyHttpsTunnel({
                            hostname: 'localhost',
                            port,
                            headers: headersConnect,
                        });

                        try {
                            await expect(instance.post(
                                `${servers.urlHttps}/mirror/payload`,
                                postData,
                                {
                                    httpsAgent,
                                    timeout: 1,
                                }
                            ))
                                .rejects
                                .toThrow('timeout');
                        } finally {
                            httpsAgent.close();

                            // Lets the server close the socket
                            await sleep(500);
                        }
                    }
                );

                it(
                    'should refuse connection if connects on a closed port',
                    async() => {
                        const headersConnect: OutgoingHttpHeaders = {
                            'Proxy-Authorization': 'Basic fake_token',
                        };
                        headersConnect[ `${SCRAPOXY_HEADER_PREFIX}-Mode` ] = 'tunnel';

                        const httpsAgent = new AgentProxyHttpsTunnel({
                            hostname: 'localhost',
                            port,
                            headers: headersConnect,
                        });

                        try {
                            await expect(instance.post(
                                // This is a HTTP request on a closed HTTP port
                                `https://localhost:${servers.portHttps - 100}/mirror/payload`,
                                postData,
                                {
                                    httpsAgent,
                                }
                            )).rejects.toThrow('ECONNREFUSED');

                            expect(httpsAgent.headers)
                                .toHaveProperty(
                                    `${SCRAPOXY_HEADER_PREFIX_LC}-proxyname`,
                                    proxy.id
                                );
                        } finally {
                            httpsAgent.close();
                        }
                    }
                );

                it(
                    'should request GET',
                    async() => {
                        const headersConnect: OutgoingHttpHeaders = {
                            'Proxy-Authorization': 'Basic fake_token',
                        };
                        headersConnect[ `${SCRAPOXY_HEADER_PREFIX}-Mode` ] = 'tunnel';

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

                            expect(res.status)
                                .toBe(200);
                            expect(res.statusText)
                                .toBe('OK');

                            expect(httpsAgent.headers)
                                .toHaveProperty(
                                    `${SCRAPOXY_HEADER_PREFIX_LC}-proxyname`,
                                    proxy.id
                                );
                        } finally {
                            httpsAgent.close();
                        }
                    }
                );

                it(
                    'should request POST',
                    async() => {
                        const headersConnect: OutgoingHttpHeaders = {
                            'Proxy-Authorization': 'Basic fake_token',
                        };
                        headersConnect[ `${SCRAPOXY_HEADER_PREFIX}-Mode` ] = 'tunnel';

                        const httpsAgent = new AgentProxyHttpsTunnel({
                            hostname: 'localhost',
                            port,
                            headers: headersConnect,
                        });

                        try {
                            const res = await instance.post(
                                `${servers.urlHttps}/mirror/payload`,
                                postData,
                                {
                                    httpsAgent,
                                }
                            );

                            expect(res.status)
                                .toBe(200);
                            expect(res.statusText)
                                .toBe('OK');
                            expect(res.data)
                                .toEqual(postData);

                            expect(httpsAgent.headers)
                                .toHaveProperty(
                                    `${SCRAPOXY_HEADER_PREFIX_LC}-proxyname`,
                                    proxy.id
                                );
                        } finally {
                            httpsAgent.close();
                        }
                    }
                );
            }
        );

        it(
            'should have no socket anymore',
            async() => {
                await waitFor(() => {
                    expect(master.socketsSize)
                        .toBe(0);
                });
            }
        );
    }
);
