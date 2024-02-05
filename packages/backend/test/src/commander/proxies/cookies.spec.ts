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
    PROXY_TIMEOUT_DISCONNECTED_DEFAULT_TEST,
    PROXY_TIMEOUT_UNREACHABLE_DEFAULT,
    SCRAPOXY_COOKIE_PREFIX,
    SCRAPOXY_HEADER_PREFIX,
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
    IProjectToCreate,
} from '@scrapoxy/common';
import type { OutgoingHttpHeaders } from 'http';


describe(
    'Commander - Proxies - Cookies',
    () => {
        const logger = new Logger();
        const
            datacenterLocalApp = new DatacenterLocalApp(logger),
            instance = axios.create({
                validateStatus: () => true,
            }),
            projectToCreate: IProjectToCreate = {
                name: 'myproject',
                autoRotate: {
                    enabled: true,
                    min: ONE_MINUTE_IN_MS * 30,
                    max: ONE_MINUTE_IN_MS * 30,
                },
                autoScaleUp: true,
                autoScaleDown: {
                    enabled: true,
                    value: ONE_MINUTE_IN_MS,
                },
                cookieSession: true,
                mitm: true,
                proxiesMin: 1,
                useragentOverride: false,
            },
            servers = new TestServers(),
            subscriptionId = uuid();
        let
            ca: string,
            commanderApp: CommanderApp,
            connector: IConnectorView,
            masterApp: MasterApp,
            project: IProjectData,
            proxyId: string,
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
            project = await commanderApp.frontendClient.createProject(projectToCreate);

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
                    proxiesTimeoutDisconnected: PROXY_TIMEOUT_DISCONNECTED_DEFAULT_TEST,
                    proxiesTimeoutUnreachable: {
                        enabled: true,
                        value: PROXY_TIMEOUT_UNREACHABLE_DEFAULT,
                    },
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

                proxyId = views[ 0 ].proxies[ 0 ].id;
            });
        });

        afterAll(async() => {
            await commanderApp.stop();

            await Promise.all([
                masterApp.stop(), datacenterLocalApp.close(), servers.close(),
            ]);
        });

        describe(
            'Requests to an existing proxy with cookie',
            () => {
                it(
                    'should force route with HTTP over HTTP proxy',
                    async() => {
                        const res = await instance.get(
                            `${servers.urlHttp}/mirror/headers`,
                            {
                                headers: {
                                    'Proxy-Authorization': `Basic ${token}`,
                                    Cookie: `${SCRAPOXY_COOKIE_PREFIX}-proxyname=${proxyId}`,
                                },
                                proxy: {
                                    host: 'localhost',
                                    port: masterApp.masterPort,
                                    protocol: 'http',
                                },
                            }
                        );

                        expect(res.status)
                            .toBe(200);

                        const setCookieHeaderFirst = res.headers[ 'set-cookie' ]?.[ 0 ];
                        expect(setCookieHeaderFirst)
                            .toContain(`${SCRAPOXY_COOKIE_PREFIX}-proxyname=${proxyId};`);
                        expect(setCookieHeaderFirst)
                            .toContain('HttpOnly');
                    }
                );

                it(
                    'should force route with HTTPS over HTTP',
                    async() => {
                        const res = await instance.get(
                            `${servers.urlHttps}/mirror/headers`,
                            {
                                headers: {
                                    'Proxy-Authorization': `Basic ${token}`,
                                    Cookie: `${SCRAPOXY_COOKIE_PREFIX}-proxyname=${proxyId}`,
                                },
                                proxy: {
                                    host: 'localhost',
                                    port: masterApp.masterPort,
                                    protocol: 'http',
                                },
                            }
                        );

                        expect(res.status)
                            .toBe(200);

                        const setCookieHeaderFirst = res.headers[ 'set-cookie' ]?.[ 0 ];
                        expect(setCookieHeaderFirst)
                            .toContain(`${SCRAPOXY_COOKIE_PREFIX}-proxyname=${proxyId};`);
                        expect(setCookieHeaderFirst)
                            .toContain('HttpOnly; Secure; SameSite=None');
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
                            const res = await instance.get(
                                `${servers.urlHttps}/mirror/headers`,
                                {
                                    httpsAgent,
                                    headers: {
                                        Cookie: `${SCRAPOXY_COOKIE_PREFIX}-proxyname=${proxyId}`,
                                    },
                                }
                            );

                            expect(res.status)
                                .toBe(200);

                            const setCookieHeaderFirst = res.headers[ 'set-cookie' ]?.[ 0 ];
                            expect(setCookieHeaderFirst)
                                .toContain(`${SCRAPOXY_COOKIE_PREFIX}-proxyname=${proxyId};`);
                            expect(setCookieHeaderFirst)
                                .toContain('HttpOnly; Secure; SameSite=None');
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
                                    headers: {
                                        Cookie: `${SCRAPOXY_COOKIE_PREFIX}-proxyname=${proxyId}`,
                                    },
                                }
                            );

                            expect(res.status)
                                .toBe(200);

                            expect(res.data)
                                .toHaveProperty(
                                    'cookie',
                                    `${SCRAPOXY_COOKIE_PREFIX}-proxyname=${proxyId}`
                                );
                            expect(res.headers).not.toHaveProperty('set-cookie');
                        } finally {
                            httpsAgent.close();
                        }
                    }
                );
            }
        );

        it(
            'should update project settings to stop injecting cookies',
            async() => {
                await commanderApp.frontendClient.updateProject(
                    project.id,
                    {
                        ...projectToCreate,
                        cookieSession: false,
                    }
                );

                await waitFor(async() => {
                    const projectFound = await commanderApp.frontendClient.getProjectById(project.id);
                    expect(projectFound.cookieSession)
                        .toBeFalsy();
                });
            }
        );

        describe(
            'Requests to an existing proxy without cookie',
            () => {
                it(
                    'should force route with HTTP over HTTP proxy',
                    async() => {
                        // With cookie in request
                        const res = await instance.get(
                            `${servers.urlHttp}/mirror/headers`,
                            {
                                headers: {
                                    'Proxy-Authorization': `Basic ${token}`,
                                    Cookie: `${SCRAPOXY_COOKIE_PREFIX}-proxyname=${proxyId}`,
                                },
                                proxy: {
                                    host: 'localhost',
                                    port: masterApp.masterPort,
                                    protocol: 'http',
                                },
                            }
                        );

                        expect(res.status)
                            .toBe(200);

                        const setCookieHeaderFirst = res.headers[ 'set-cookie' ]?.[ 0 ];
                        expect(setCookieHeaderFirst)
                            .toContain(`${SCRAPOXY_COOKIE_PREFIX}-proxyname=;`);
                        expect(setCookieHeaderFirst)
                            .toContain('HttpOnly; expires=Thu, 01 Jan 1970 00:00:00 GMT');

                        // Without cookie in request
                        const res2 = await instance.get(
                            `${servers.urlHttp}/mirror/headers`,
                            {
                                headers: {
                                    'Proxy-Authorization': `Basic ${token}`,
                                },
                                proxy: {
                                    host: 'localhost',
                                    port: masterApp.masterPort,
                                    protocol: 'http',
                                },
                            }
                        );

                        expect(res2.status)
                            .toBe(200);

                        expect(res2.headers).not.toHaveProperty('set-cookie');
                    }
                );

                it(
                    'should force route with HTTPS over HTTP',
                    async() => {
                        // With cookie in request
                        const res = await instance.get(
                            `${servers.urlHttps}/mirror/headers`,
                            {
                                headers: {
                                    'Proxy-Authorization': `Basic ${token}`,
                                    Cookie: `${SCRAPOXY_COOKIE_PREFIX}-proxyname=${proxyId}`,
                                },
                                proxy: {
                                    host: 'localhost',
                                    port: masterApp.masterPort,
                                    protocol: 'http',
                                },
                            }
                        );

                        expect(res.status)
                            .toBe(200);

                        const setCookieHeaderFirst = res.headers[ 'set-cookie' ]?.[ 0 ];
                        expect(setCookieHeaderFirst)
                            .toContain(`${SCRAPOXY_COOKIE_PREFIX}-proxyname=;`);
                        expect(setCookieHeaderFirst)
                            .toContain('HttpOnly; Secure; SameSite=None; expires=Thu, 01 Jan 1970 00:00:00 GMT');

                        // Without cookie in request
                        const res2 = await instance.get(
                            `${servers.urlHttps}/mirror/headers`,
                            {
                                headers: {
                                    'Proxy-Authorization': `Basic ${token}`,
                                },
                                proxy: {
                                    host: 'localhost',
                                    port: masterApp.masterPort,
                                    protocol: 'http',
                                },
                            }
                        );

                        expect(res2.status)
                            .toBe(200);

                        expect(res2.headers).not.toHaveProperty('set-cookie');
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
                            // With cookie in request
                            const res = await instance.get(
                                `${servers.urlHttps}/mirror/headers`,
                                {
                                    httpsAgent,
                                    headers: {
                                        Cookie: `${SCRAPOXY_COOKIE_PREFIX}-proxyname=${proxyId}`,
                                    },
                                }
                            );

                            expect(res.status)
                                .toBe(200);

                            const setCookieHeaderFirst = res.headers[ 'set-cookie' ]?.[ 0 ];
                            expect(setCookieHeaderFirst)
                                .toContain(`${SCRAPOXY_COOKIE_PREFIX}-proxyname=;`);
                            expect(setCookieHeaderFirst)
                                .toContain('HttpOnly; Secure; SameSite=None; expires=Thu, 01 Jan 1970 00:00:00 GMT');

                            // Without cookie in request
                            const res2 = await instance.get(
                                `${servers.urlHttps}/mirror/headers`,
                                {
                                    httpsAgent,
                                }
                            );

                            expect(res2.status)
                                .toBe(200);

                            expect(res2.headers).not.toHaveProperty('set-cookie');
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

                        const httpsAgent = new AgentProxyHttpsTunnel({
                            hostname: 'localhost',
                            port: masterApp.masterPort,
                            headers: headersConnect,
                        });

                        try {
                            // With cookie in request
                            const res = await instance.get(
                                `${servers.urlHttps}/mirror/headers`,
                                {
                                    httpsAgent,
                                    headers: {
                                        Cookie: `${SCRAPOXY_COOKIE_PREFIX}-proxyname=${proxyId}`,
                                    },
                                }
                            );

                            expect(res.status)
                                .toBe(200);

                            expect(res.data)
                                .toHaveProperty(
                                    'cookie',
                                    `${SCRAPOXY_COOKIE_PREFIX}-proxyname=${proxyId}`
                                );
                            expect(res.headers).not.toHaveProperty('set-cookie');

                            // Without cookie in request
                            const res2 = await instance.get(
                                `${servers.urlHttps}/mirror/headers`,
                                {
                                    httpsAgent,
                                }
                            );

                            expect(res2.status)
                                .toBe(200);

                            expect(res2.data).not.toHaveProperty('cookie');
                            expect(res2.headers).not.toHaveProperty('set-cookie');
                        } finally {
                            httpsAgent.close();
                        }
                    }
                );
            }
        );
    }
);
