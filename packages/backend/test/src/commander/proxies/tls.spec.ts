import { OutgoingHttpHeaders } from 'http';
import { Agent } from 'https';
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
    IConnectorToCreate,
    IProjectToCreate,
    ONE_MINUTE_IN_MS,
    PROXY_TIMEOUT_DISCONNECTED_DEFAULT_TEST,
    PROXY_TIMEOUT_UNREACHABLE_DEFAULT,
    SCRAPOXY_HEADER_PREFIX,
} from '@scrapoxy/common';
import axios, { RawAxiosRequestHeaders } from 'axios';
import { v4 as uuid } from 'uuid';
import type {
    IConnectorDatacenterLocalConfig,
    IConnectorDatacenterLocalCredential,
} from '@scrapoxy/backend-connectors';
import type {
    IConnectorView,
    IProjectData,
} from '@scrapoxy/common';


describe(
    'Commander - Proxies - TLS fingerprint',
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
            connectorToCreate: IConnectorToCreate,
            masterApp: MasterApp,
            project: IProjectData,
            projectToCreate: IProjectToCreate,
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
            projectToCreate = {
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
                ciphersShuffle: false,
            };
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
            connectorToCreate = {
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
            };
            connector = await commanderApp.frontendClient.createConnector(
                project.id,
                connectorToCreate
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


        let ja3reference: string;
        describe(
            'Direct connection',
            () => {
                it(
                    'should get the JA3 fingerprint of the Node client',
                    async() => {
                        const res = await instance.get(
                            `${servers.urlHttps}/mirror/tls`,
                            {
                                httpsAgent: new Agent({
                                    rejectUnauthorized: false,
                                }),
                            }
                        );
                        ja3reference = res.data.ja3;
                        expect(ja3reference?.length)
                            .toBeGreaterThan(0);
                    }
                );
            }
        );

        describe(
            'Shuffle disabled',
            () => {
                it(
                    'should get the same JA3 fingerprint for each proxy with HTTPS over HTTP requests',
                    async() => {
                        const headers: RawAxiosRequestHeaders = {
                            'Proxy-Authorization': `Basic ${token}`,
                        };
                        for (let i = 0; i < connectorToCreate.proxiesMax; ++i) {
                            const res = await instance.get(
                                `${servers.urlHttps}/mirror/tls`,
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

                            expect(res.data.ja3)
                                .toBe(ja3reference);
                        }
                    }
                );

                it(
                    'should get the same JA3 fingerprint for each proxy with HTTPS over HTTP tunnel requests (MITM mode)',
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
                            for (let i = 0; i < connectorToCreate.proxiesMax; ++i) {
                                const res = await instance.get(
                                    `${servers.urlHttps}/mirror/tls`,
                                    {
                                        httpsAgent,
                                    }
                                );

                                expect(res.status)
                                    .toBe(200);

                                expect(res.data.ja3)
                                    .toBe(ja3reference);
                            }
                        } finally {
                            httpsAgent.close();
                        }
                    }
                );

                it(
                    'should get the same JA3 fingerprint for each proxy with HTTPS over HTTP tunnel requests (tunnel mode)',
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
                            for (let round = 0; round < 2; ++round) {
                                for (let i = 0; i < connectorToCreate.proxiesMax; ++i) {
                                    const res = await instance.get(
                                        `${servers.urlHttps}/mirror/tls`,
                                        {
                                            httpsAgent,
                                        }
                                    );

                                    expect(res.status)
                                        .toBe(200);

                                    expect(res.data.ja3)
                                        .toBe(ja3reference);
                                }
                            }
                        } finally {
                            httpsAgent.close();
                        }
                    }
                );
            }
        );

        describe(
            'Shuffle enabled',
            () => {
                it(
                    'should enable ciphers shuffle',
                    async() => {
                        await commanderApp.frontendClient.updateProject(
                            project.id,
                            {
                                ...projectToCreate,
                                ciphersShuffle: true,
                            }
                        );
                    }
                );

                it(
                    'should get a different JA3 fingerprint for each proxy with HTTPS over HTTP requests',
                    async() => {
                        const headers: RawAxiosRequestHeaders = {
                            'Proxy-Authorization': `Basic ${token}`,
                        };
                        const ja3hashes: string[] = [];
                        for (let round = 0; round < 2; ++round) {
                            for (let i = 0; i < connectorToCreate.proxiesMax; ++i) {
                                const res = await instance.get(
                                    `${servers.urlHttps}/mirror/tls`,
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

                                const ja3 = res.data.ja3;
                                expect(ja3).not.toBe(ja3reference);

                                if (ja3hashes.length < connectorToCreate.proxiesMax) {
                                    ja3hashes.push(ja3);
                                } else {
                                    const ja3proxy = ja3hashes[ i ];
                                    expect(ja3)
                                        .toBe(ja3proxy);
                                }
                            }
                        }
                    }
                );

                it(
                    'should get a different JA3 fingerprint for each proxy with HTTPS over HTTP tunnel requests (MITM mode)',
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
                            const ja3hashes: string[] = [];
                            for (let round = 0; round < 2; ++round) {
                                for (let i = 0; i < connectorToCreate.proxiesMax; ++i) {
                                    const res = await instance.get(
                                        `${servers.urlHttps}/mirror/tls`,
                                        {
                                            httpsAgent,
                                        }
                                    );

                                    expect(res.status)
                                        .toBe(200);

                                    const ja3 = res.data.ja3;
                                    expect(ja3).not.toBe(ja3reference);

                                    if (ja3hashes.length < connectorToCreate.proxiesMax) {
                                        ja3hashes.push(ja3);
                                    } else {
                                        const ja3proxy = ja3hashes[ i ];
                                        expect(ja3)
                                            .toBe(ja3proxy);
                                    }
                                }
                            }
                        } finally {
                            httpsAgent.close();
                        }
                    }
                );
            }
        );
    }
);
