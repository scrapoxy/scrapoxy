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
    ONE_SECOND_IN_MS,
    PROXY_TIMEOUT_DISCONNECTED_DEFAULT_TEST,
    PROXY_TIMEOUT_UNREACHABLE_DEFAULT,
    SCRAPOXY_HEADER_PREFIX,
} from '@scrapoxy/common';
import axios from 'axios';
import { v4 as uuid } from 'uuid';
import type {
    IConnectorDatacenterLocalConfig,
    IConnectorDatacenterLocalCredential,
} from '@scrapoxy/backend-connectors';
import type {
    IConnectorView,
    IProjectData,
} from '@scrapoxy/common';
import type { OutgoingHttpHeaders } from 'http';


describe(
    'Commander - Proxies - Auth',
    () => {
        const logger = new Logger();
        const
            datacenterLocalApp = new DatacenterLocalApp(logger),
            instance = axios.create({
                validateStatus: () => true,
            }),
            servers = new TestServers();
        let
            ca: string,
            commanderApp: CommanderApp,
            connector: IConnectorView,
            masterApp: MasterApp,
            project: IProjectData,
            token: string;

        beforeAll(async() => {
            // Get CA certificate
            ca = await readCaCert();

            // Start target and local connector
            await Promise.all([
                servers.listen(), datacenterLocalApp.start(),
            ]);

            const subscriptionId = uuid();
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
            });

            // Create credential
            const credentialConfigConfig: IConnectorDatacenterLocalCredential = {
                subscriptionId,
            };
            const credential = await commanderApp.frontendClient.createCredential(
                project.id,
                {
                    name: 'mycredential',
                    type: CONNECTOR_DATACENTER_LOCAL_TYPE,
                    config: credentialConfigConfig,
                }
            );

            await waitFor(async() => {
                await commanderApp.frontendClient.getCredentialById(
                    project.id,
                    credential.id
                );
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
                    proxiesMax: 1,
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
            });
        });

        afterAll(async() => {
            await commanderApp.stop();

            await Promise.all([
                masterApp.stop(), datacenterLocalApp.close(), servers.close(),
            ]);
        });

        describe(
            'Token',
            () => {
                it(
                    'should not make a request without token',
                    async() => {
                        const res = await instance.get(
                            `${servers.urlHttp}/file/big`,
                            {
                                params: {
                                    size: 1024,
                                },
                                proxy: {
                                    host: 'localhost',
                                    port: masterApp.masterPort,
                                    protocol: 'http',
                                },
                            }
                        );

                        expect(res.status)
                            .toBe(407);
                    }
                );

                it(
                    'should not make a request with a wrong token',
                    async() => {
                        const res = await instance.get(
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
                                    port: masterApp.masterPort,
                                    protocol: 'http',
                                },
                            }
                        );

                        expect(res.status)
                            .toBe(407);
                    }
                );

                it(
                    'should get the token',
                    async() => {
                        token = await commanderApp.frontendClient.getProjectTokenById(project.id);
                        expect(token.length)
                            .toBeGreaterThan(0);
                    }
                );

                it(
                    'should make a request with a token',
                    async() => {
                        await instance.get(
                            `${servers.urlHttp}/file/big`,
                            {
                                headers: {
                                    'Proxy-Authorization': `Basic ${token}`,
                                },
                                params: {
                                    size: 1024,
                                },
                                proxy: {
                                    host: 'localhost',
                                    port: masterApp.masterPort,
                                    protocol: 'http',
                                },
                            }
                        );
                    }
                );

                it(
                    'should renew the token',
                    async() => {
                        const tokenRenewed = await commanderApp.frontendClient.renewProjectToken(project.id);

                        expect(tokenRenewed.length)
                            .toBeGreaterThan(0);
                        expect(tokenRenewed).not.toBe(token);
                    }
                );

                it(
                    'should not make a request with the old token',
                    async() => {
                        const res = await instance.get(
                            `${servers.urlHttp}/file/big`,
                            {
                                headers: {
                                    'Proxy-Authorization': `Basic ${token}`,
                                },
                                params: {
                                    size: 1024,
                                },
                                proxy: {
                                    host: 'localhost',
                                    port: masterApp.masterPort,
                                    protocol: 'http',
                                },
                            }
                        );

                        expect(res.status)
                            .toBe(407);
                    }
                );

                it(
                    'should get the new token',
                    async() => {
                        token = await commanderApp.frontendClient.getProjectTokenById(project.id);
                        expect(token.length)
                            .toBeGreaterThan(0);
                    }
                );

                it(
                    'should make a HTTP over HTTP request with the new token',
                    async() => {
                        await instance.get(
                            `${servers.urlHttp}/file/big`,
                            {
                                headers: {
                                    'Proxy-Authorization': `Basic ${token}`,
                                },
                                params: {
                                    size: 1024,
                                },
                                proxy: {
                                    host: 'localhost',
                                    port: masterApp.masterPort,
                                    protocol: 'http',
                                },
                            }
                        );
                    }
                );

                it(
                    'should make a HTTPS over HTTP request with the new token',
                    async() => {
                        await instance.get(
                            `${servers.urlHttps}/file/big`,
                            {
                                headers: {
                                    'Proxy-Authorization': `Basic ${token}`,
                                },
                                params: {
                                    size: 1024,
                                },
                                proxy: {
                                    host: 'localhost',
                                    port: masterApp.masterPort,
                                    protocol: 'http',
                                },
                            }
                        );
                    }
                );

                it(
                    'should make a HTTPS over HTTP tunnel request with the new token (MITM mode)',
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
                            await instance.get(
                                `${servers.urlHttps}/file/big`,
                                {
                                    params: {
                                        size: 1024,
                                    },
                                    httpsAgent,
                                }
                            );
                        } finally {
                            httpsAgent.close();
                        }
                    }
                );

                it(
                    'should make a HTTPS over HTTP tunnel request with the new token (tunnel mode)',
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
                            await instance.get(
                                `${servers.urlHttps}/file/big`,
                                {
                                    params: {
                                        size: 1024,
                                    },
                                    httpsAgent,
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
            'Certificate - Renew',
            () => {
                it(
                    'should renew the certificate',
                    async() => {
                        await commanderApp.frontendClient.renewConnectorCertificate(
                            project.id,
                            connector.id,
                            10 * ONE_MINUTE_IN_MS
                        );
                    }
                );

                it(
                    'should have proxies with an error status',
                    async() => {
                        await waitFor(
                            async() => {
                                const view = await commanderApp.frontendClient.getAllConnectorProxiesById(
                                    project.id,
                                    connector.id
                                );

                                for (const proxy of view.proxies) {
                                    expect(proxy.fingerprintError)
                                        .toBe('invalid certificate');
                                    expect(proxy.fingerprint)
                                        .toBeNull();
                                }
                            },
                            20
                        );
                    },
                    ONE_MINUTE_IN_MS
                );

                it(
                    'should not make a HTTP over HTTP request with the new previous certificate',
                    async() => {
                        const res = await instance.get(
                            `${servers.urlHttp}/file/big`,
                            {
                                headers: {
                                    'Proxy-Authorization': `Basic ${token}`,
                                },
                                params: {
                                    size: 1024,
                                },
                                proxy: {
                                    host: 'localhost',
                                    port: masterApp.masterPort,
                                    protocol: 'http',
                                },
                                validateStatus: (status) => status === 407,
                            }
                        );

                        expect(res.data.id)
                            .toBe('no_proxy');

                        // Cannot find any online proxies
                        // certificate expired => fingerprint failed => connection status error => no available proxy
                    }
                );

                it(
                    'should reinstall the connector',
                    async() => {
                        await commanderApp.frontendClient.activateConnector(
                            project.id,
                            connector.id,
                            false
                        );

                        await waitFor(async() => {
                            const connectorFound = await commanderApp.frontendClient.getConnectorById(
                                project.id,
                                connector.id
                            );
                            expect(connectorFound.active)
                                .toBeFalsy();

                        });

                        const connectorRef = await commanderApp.frontendClient.getConnectorById(
                            project.id,
                            connector.id
                        );
                        const imageIdRef = (connectorRef.config as IConnectorDatacenterLocalConfig).imageId;
                        await commanderApp.frontendClient.renewConnectorCertificate(
                            project.id,
                            connector.id,
                            10 * ONE_MINUTE_IN_MS
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
                            expect(connectorConfigFound.imageId)
                                .not.toBe(imageIdRef);
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
                        });
                    }
                );

                it(
                    'should make a HTTP over HTTP request with the new certificate',
                    async() => {
                        await instance.get(
                            `${servers.urlHttp}/file/big`,
                            {
                                headers: {
                                    'Proxy-Authorization': `Basic ${token}`,
                                },
                                params: {
                                    size: 1024,
                                },
                                proxy: {
                                    host: 'localhost',
                                    port: masterApp.masterPort,
                                    protocol: 'http',
                                },
                            }
                        );
                    }
                );

                it(
                    'should make a HTTPS over HTTP request with the new certificate',
                    async() => {
                        await instance.get(
                            `${servers.urlHttps}/file/big`,
                            {
                                headers: {
                                    'Proxy-Authorization': `Basic ${token}`,
                                },
                                params: {
                                    size: 1024,
                                },
                                proxy: {
                                    host: 'localhost',
                                    port: masterApp.masterPort,
                                    protocol: 'http',
                                },
                            }
                        );
                    }
                );

                it(
                    'should make a HTTPS over HTTP tunnel request with the new certificate (MITM mode)',
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
                            await instance.get(
                                `${servers.urlHttps}/file/big`,
                                {
                                    params: {
                                        size: 1024,
                                    },
                                    httpsAgent,
                                }
                            );
                        } finally {
                            httpsAgent.close();
                        }
                    }
                );

                it(
                    'should make a HTTPS over HTTP tunnel request with the new certificate (tunnel mode)',
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
                            await instance.get(
                                `${servers.urlHttps}/file/big`,
                                {
                                    params: {
                                        size: 1024,
                                    },
                                    httpsAgent,
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
            'Certificate - Expiration',
            () => {
                it(
                    'should renew the certificate and reinstall the connector',
                    async() => {
                        await commanderApp.frontendClient.activateConnector(
                            project.id,
                            connector.id,
                            false
                        );

                        await waitFor(async() => {
                            const connectorFound = await commanderApp.frontendClient.getConnectorById(
                                project.id,
                                connector.id
                            );
                            expect(connectorFound.active)
                                .toBeFalsy();

                        });

                        const connectorRef = await commanderApp.frontendClient.getConnectorById(
                            project.id,
                            connector.id
                        );
                        const imageIdRef = (connectorRef.config as IConnectorDatacenterLocalConfig).imageId;
                        await commanderApp.frontendClient.renewConnectorCertificate(
                            project.id,
                            connector.id,
                            10 * ONE_SECOND_IN_MS
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
                            expect(connectorConfigFound.imageId)
                                .not.toBe(imageIdRef);
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
                        });
                    }
                );

                it(
                    'should have proxies connected',
                    async() => {
                        await waitFor(async() => {
                            const view = await commanderApp.frontendClient.getAllConnectorProxiesById(
                                project.id,
                                connector.id
                            );

                            for (const proxy of view.proxies) {
                                expect(proxy.fingerprint)
                                    .toBeDefined();
                                expect(proxy.fingerprintError)
                                    .toBeNull();
                            }
                        });
                    }
                );

                it(
                    'should have proxies with an error status (certificate expired)',
                    async() => {
                        await waitFor(
                            async() => {
                                const view = await commanderApp.frontendClient.getAllConnectorProxiesById(
                                    project.id,
                                    connector.id
                                );

                                for (const proxy of view.proxies) {
                                    expect(proxy.fingerprint)
                                        .toBeNull();
                                    expect(proxy.fingerprintError)
                                        .toBe('invalid certificate');
                                }
                            },
                            20
                        );
                    },
                    ONE_MINUTE_IN_MS
                );
            }
        );
    }
);
