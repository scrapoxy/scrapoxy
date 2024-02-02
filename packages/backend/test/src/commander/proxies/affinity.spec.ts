import { Logger } from '@nestjs/common';
import {
    DatacenterLocalApp,
    readCaCert,
    SUBSCRIPTION_LOCAL_DEFAULTS,
} from '@scrapoxy/backend-sdk';
import {
    AgentProxyHttpsTunnel,
    CommanderApp,
    MasterApp,
    TestServers,
    waitFor,
} from '@scrapoxy/backend-test-sdk';
import {
    CONNECTOR_DATACENTER_LOCAL_TYPE,
    countProxiesOnlineViews,
    ONE_MINUTE_IN_MS,
    PROXY_TIMEOUT_TEST_DEFAULT,
    SCRAPOXY_HEADER_PREFIX,
    SCRAPOXY_HEADER_PREFIX_LC,
} from '@scrapoxy/common';
import axios from 'axios';
import { v4 as uuid } from 'uuid';
import type {
    IConnectorDatacenterLocalConfig,
    IConnectorDatacenterLocalCredential,
} from '@scrapoxy/backend-sdk';
import type {
    IConnectorView,
    IProjectData,
    IProxyView,
} from '@scrapoxy/common';
import type { RawAxiosRequestHeaders } from 'axios';
import type { OutgoingHttpHeaders } from 'http';


describe(
    'Commander - Proxies - Affinity',
    () => {
        const logger = new Logger();
        const
            datacenterLocalApp = new DatacenterLocalApp(logger),
            instance = axios.create({
                validateStatus: () => true,
            }),
            servers = new TestServers(),
            subscriptionId = uuid();
        let
            ca: string,
            commanderApp: CommanderApp,
            connector: IConnectorView,
            masterApp: MasterApp,
            project: IProjectData,
            proxy: IProxyView,
            token: string;

        beforeAll(async() => {
            // Get CA certificate
            ca = await readCaCert();

            // Start target & local connector
            await Promise.all([
                servers.listen(), datacenterLocalApp.start(),
            ]);

            await datacenterLocalApp.client.createSubscription({
                id: subscriptionId,
                ...SUBSCRIPTION_LOCAL_DEFAULTS,
            });

            // Start app
            commanderApp = CommanderApp.defaults({
                datacenterLocalAppUrl: datacenterLocalApp.url,
                fingerprintUrl: servers.urlFingerprint,
                logger,
            });
            await commanderApp.start();
            masterApp = MasterApp.defaults({
                datacenterLocalAppUrl: datacenterLocalApp.url,
                commanderApp,
                fingerprintUrl: servers.urlFingerprint,
                logger,
            });
            await masterApp.start();

            // Create project
            project = await commanderApp.frontendClient.createProject({
                name: 'myproject',
                autoRotate: true,
                autoRotateDelayRange: {
                    min: ONE_MINUTE_IN_MS * 30,
                    max: ONE_MINUTE_IN_MS * 30,
                },
                autoScaleUp: true,
                autoScaleDown: true,
                autoScaleDownDelay: ONE_MINUTE_IN_MS,
                cookieSession: true,
                mitm: true,
                proxiesMin: 1,
                useragentOverride: false,
            });

            // Create credential
            const credentialConfig: IConnectorDatacenterLocalCredential = {
                subscriptionId,
            };
            const credential = await commanderApp.frontendClient.createCredential(
                project.id,
                {
                    name: 'mycredential',
                    type: CONNECTOR_DATACENTER_LOCAL_TYPE,
                    config: credentialConfig,
                }
            );

            await waitFor(async() => {
                await commanderApp.frontendClient.getCredentialById(
                    project.id,
                    credential.id
                );

                token = await commanderApp.frontendClient.getProjectTokenById(project.id);
            });

            // Create, install and activate connector
            const connectorConfig: IConnectorDatacenterLocalConfig = {
                region: 'europe',
                size: 'small',
                imageId: void 0,
            };
            connector = await commanderApp.frontendClient.createConnector(
                project.id,
                {
                    name: 'myconnector',
                    proxiesMax: 2,
                    proxiesTimeout: PROXY_TIMEOUT_TEST_DEFAULT,
                    credentialId: credential.id,
                    config: connectorConfig,
                    certificateDurationInMs: 10 * ONE_MINUTE_IN_MS,
                }
            );

            await commanderApp.frontendClient.installConnector(
                project.id,
                connector.id,
                {
                    config: {},
                }
            );

            await waitFor(async() => {
                const connectorFound = await commanderApp.frontendClient.getConnectorById(
                    project.id,
                    connector.id
                );
                const connectorConfigFound = connectorFound.config as IConnectorDatacenterLocalConfig;
                expect(connectorConfigFound.imageId?.length)
                    .toBeGreaterThan(0);
            });

            await commanderApp.frontendClient.activateConnector(
                project.id,
                connector.id,
                true
            );

            await waitFor(async() => {
                const views = await commanderApp.frontendClient.getAllProjectConnectorsAndProxiesById(project.id);
                expect(countProxiesOnlineViews(views))
                    .toBe(connector.proxiesMax);

                proxy = views[ 0 ].proxies[ 0 ];
            });
        });

        afterAll(async() => {
            await commanderApp.stop();

            await Promise.all([
                masterApp.stop(), datacenterLocalApp.close(), servers.close(),
            ]);
        });

        describe(
            'Requests to an existing proxy',
            () => {
                it(
                    'should force route with HTTP over HTTP proxy',
                    async() => {
                        for (let i = 0; i < 10; ++i) {
                            const headers: RawAxiosRequestHeaders = {
                                'Proxy-Authorization': `Basic ${token}`,
                            };
                            headers[ `${SCRAPOXY_HEADER_PREFIX}-Proxyname` ] = proxy.id;

                            const res = await instance.get(
                                `${servers.urlHttp}/mirror/headers`,
                                {
                                    headers,
                                    proxy: {
                                        host: 'localhost',
                                        port: masterApp.masterPort,
                                        protocol: 'http',
                                    },
                                }
                            );

                            expect(res.status)
                                .toBe(200);

                            expect(res.data).not.toHaveProperty(`${SCRAPOXY_HEADER_PREFIX_LC}-proxyname`);

                            expect(res.headers)
                                .toHaveProperty(
                                    `${SCRAPOXY_HEADER_PREFIX_LC}-proxyname`,
                                    proxy.id
                                );
                        }
                    }
                );

                it(
                    'should force route with HTTPS over HTTP',
                    async() => {
                        for (let i = 0; i < 10; ++i) {
                            const headers: RawAxiosRequestHeaders = {
                                'Proxy-Authorization': `Basic ${token}`,
                            };
                            headers[ `${SCRAPOXY_HEADER_PREFIX}-Proxyname` ] = proxy.id;

                            const res = await instance.get(
                                `${servers.urlHttps}/mirror/headers`,
                                {
                                    headers,
                                    proxy: {
                                        host: 'localhost',
                                        port: masterApp.masterPort,
                                        protocol: 'http',
                                    },
                                }
                            );

                            expect(res.status)
                                .toBe(200);

                            expect(res.data).not.toHaveProperty(`${SCRAPOXY_HEADER_PREFIX_LC}-proxyname`);

                            expect(res.headers)
                                .toHaveProperty(
                                    `${SCRAPOXY_HEADER_PREFIX_LC}-proxyname`,
                                    proxy.id
                                );
                        }
                    }
                );

                it(
                    'should force route with HTTPS over HTTP tunnel (MITM mode)',
                    async() => {
                        for (let i = 0; i < 10; ++i) {
                            const httpsAgent = new AgentProxyHttpsTunnel({
                                hostname: 'localhost',
                                port: masterApp.masterPort,
                                ca,
                                headers: {
                                    'Proxy-Authorization': `Basic ${token}`,
                                },
                            });

                            try {
                                const headers: RawAxiosRequestHeaders = {};
                                headers[ `${SCRAPOXY_HEADER_PREFIX}-Proxyname` ] = proxy.id;

                                const res = await instance.get(
                                    `${servers.urlHttps}/mirror/headers`,
                                    {
                                        httpsAgent,
                                        headers,
                                    }
                                );

                                expect(res.status)
                                    .toBe(200);

                                expect(res.data).not.toHaveProperty(`${SCRAPOXY_HEADER_PREFIX_LC}-proxyname`);

                                expect(res.headers)
                                    .toHaveProperty(
                                        `${SCRAPOXY_HEADER_PREFIX_LC}-proxyname`,
                                        proxy.id
                                    );
                            } finally {
                                httpsAgent.close();
                            }
                        }
                    }
                );

                it(
                    'should force route with HTTPS over HTTP tunnel (tunnel mode)',
                    async() => {
                        for (let i = 0; i < 10; ++i) {
                            const headersConnect: OutgoingHttpHeaders = {
                                'Proxy-Authorization': `Basic ${token}`,
                            };
                            headersConnect[ `${SCRAPOXY_HEADER_PREFIX}-Mode` ] = 'tunnel';
                            headersConnect[ `${SCRAPOXY_HEADER_PREFIX}-Proxyname` ] = proxy.id;

                            const httpsAgent = new AgentProxyHttpsTunnel({
                                hostname: 'localhost',
                                port: masterApp.masterPort,
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

                                expect(res.data).not.toHaveProperty(`${SCRAPOXY_HEADER_PREFIX_LC}-proxyname`);

                                expect(httpsAgent.headers)
                                    .toHaveProperty(
                                        `${SCRAPOXY_HEADER_PREFIX_LC}-proxyname`,
                                        proxy.id
                                    );
                            } finally {
                                httpsAgent.close();
                            }
                        }
                    }
                );

                it(
                    'should check the number of connects for each proxy',
                    async() => {
                        const proxies = datacenterLocalApp.getAllInstancesProxies(
                            subscriptionId,
                            'europe'
                        );
                        let
                            count0 = 0,
                            count40 = 0,
                            countOther = 0;

                        for (const p of proxies) {
                            if (p.connectsCount === 0) {
                                ++count0;
                            } else if (p.connectsCount === 40) {
                                ++count40;
                            } else {
                                ++countOther;
                            }
                        }

                        expect(count40)
                            .toBe(1);
                        expect(count0)
                            .toBe(connector.proxiesMax - 1);
                        expect(countOther)
                            .toBe(0);
                    }
                );
            }
        );

        it(
            'should replace the proxy',
            async() => {
                const view = await commanderApp.frontendClient.getAllConnectorProxiesById(
                    project.id,
                    connector.id
                );
                proxy = view.proxies[ 0 ];

                await commanderApp.frontendClient.askProxiesToRemove(
                    project.id,
                    [
                        {
                            id: proxy.id, force: false,
                        },
                    ]
                );

                await waitFor(async() => {
                    const view2 = await commanderApp.frontendClient.getAllConnectorProxiesSyncById(
                        project.id,
                        connector.id
                    );
                    const proxiesIds = view2.proxies.map((p) => p.id);
                    expect(proxiesIds)
                        .not.toContain(proxy.id);

                    expect(view2.proxies)
                        .toHaveLength(connector.proxiesMax);
                });
            }
        );

        describe(
            'Requests to a non-existent proxy fallback to any proxy',
            () => {
                it(
                    'should force route with HTTP over HTTP proxy',
                    async() => {
                        const headers: RawAxiosRequestHeaders = {
                            'Proxy-Authorization': `Basic ${token}`,
                        };
                        headers[ `${SCRAPOXY_HEADER_PREFIX}-Proxyname` ] = proxy.id;

                        const res = await instance.get(
                            `${servers.urlHttp}/mirror/headers`,
                            {
                                headers,
                                proxy: {
                                    host: 'localhost',
                                    port: masterApp.masterPort,
                                    protocol: 'http',
                                },
                            }
                        );

                        expect(res.status)
                            .toBe(200);

                        expect(res.headers)
                            .toHaveProperty(`${SCRAPOXY_HEADER_PREFIX_LC}-proxyname`);

                        expect(res.headers[ `${SCRAPOXY_HEADER_PREFIX_LC}-proxyname` ]).not.toBe(proxy.id);
                    }
                );

                it(
                    'should force route with HTTPS over HTTP',
                    async() => {
                        const headers: RawAxiosRequestHeaders = {
                            'Proxy-Authorization': `Basic ${token}`,
                        };
                        headers[ `${SCRAPOXY_HEADER_PREFIX}-Proxyname` ] = proxy.id;

                        const res = await instance.get(
                            `${servers.urlHttps}/mirror/headers`,
                            {
                                headers,
                                proxy: {
                                    host: 'localhost',
                                    port: masterApp.masterPort,
                                    protocol: 'http',
                                },
                            }
                        );

                        expect(res.status)
                            .toBe(200);

                        expect(res.headers)
                            .toHaveProperty(`${SCRAPOXY_HEADER_PREFIX_LC}-proxyname`);

                        expect(res.headers[ `${SCRAPOXY_HEADER_PREFIX_LC}-proxyname` ]).not.toBe(proxy.id);
                    }
                );

                it(
                    'should force route with HTTPS over HTTP tunnel (MITM mode)',
                    async() => {
                        const httpsAgent = new AgentProxyHttpsTunnel({
                            hostname: 'localhost',
                            port: masterApp.masterPort,
                            ca,
                            headers: {
                                'Proxy-Authorization': `Basic ${token}`,
                            },
                        });

                        try {
                            const headers: RawAxiosRequestHeaders = {};
                            headers[ `${SCRAPOXY_HEADER_PREFIX}-Proxyname` ] = proxy.id;

                            const res = await instance.get(
                                `${servers.urlHttps}/mirror/headers`,
                                {
                                    httpsAgent,
                                    headers,
                                }
                            );

                            expect(res.status)
                                .toBe(200);

                            expect(res.headers)
                                .toHaveProperty(`${SCRAPOXY_HEADER_PREFIX_LC}-proxyname`);

                            expect(res.headers[ `${SCRAPOXY_HEADER_PREFIX_LC}-proxyname` ]).not.toBe(proxy.id);
                        } finally {
                            httpsAgent.close();
                        }
                    }
                );

                it(
                    'should force route with HTTPS over HTTP tunnel (tunnel mode)',
                    async() => {
                        const headersConnect: OutgoingHttpHeaders = {
                            'Proxy-Authorization': `Basic ${token}`,
                        };
                        headersConnect[ `${SCRAPOXY_HEADER_PREFIX}-Mode` ] = 'tunnel';
                        headersConnect[ `${SCRAPOXY_HEADER_PREFIX}-Proxyname` ] = proxy.id;

                        const httpsAgent = new AgentProxyHttpsTunnel({
                            hostname: 'localhost',
                            port: masterApp.masterPort,
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

                            expect(httpsAgent.headers)
                                .toHaveProperty(`${SCRAPOXY_HEADER_PREFIX_LC}-proxyname`);

                            expect(httpsAgent.headers[ `${SCRAPOXY_HEADER_PREFIX_LC}-proxyname` ]).not.toBe(proxy.id);
                        } finally {
                            httpsAgent.close();
                        }
                    }
                );
            }
        );
    }
);
