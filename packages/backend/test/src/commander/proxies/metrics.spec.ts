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
    EEventScope,
    EventsConnectorsClient,
    ONE_MINUTE_IN_MS,
    PROXY_TIMEOUT_DISCONNECTED_DEFAULT_TEST,
    PROXY_TIMEOUT_UNREACHABLE_DEFAULT,
    SCRAPOXY_HEADER_PREFIX,
    sleep,
} from '@scrapoxy/common';
import axios from 'axios';
import { v4 as uuid } from 'uuid';
import type {
    IConnectorDatacenterLocalConfig,
    IConnectorDatacenterLocalCredential,
} from '@scrapoxy/backend-connectors';
import type {
    ICommanderFrontendClient,
    IConnectorView,
    IProjectData,
    IProxyView,
} from '@scrapoxy/common';
import type { OutgoingHttpHeaders } from 'http';


async function checkProgressiveMetrics(
    commander: ICommanderFrontendClient, projectId: string, connectorId: string
) {
    let proxyCurrent: IProxyView,
        proxyPrevious: IProxyView = (await commander.getAllConnectorProxiesById(
            projectId,
            connectorId
        )).proxies[ 0 ];

    for (let i = 0; i < 2; ++i) {
        await sleep(2000);

        proxyCurrent = (await commander.getAllConnectorProxiesById(
            projectId,
            connectorId
        )).proxies[ 0 ];

        expect(proxyCurrent.bytesReceived)
            .toBeGreaterThan(proxyPrevious.bytesReceived);

        proxyPrevious = proxyCurrent;
    }
}


describe(
    'Commander - Proxies - Metrics',
    () => {
        const logger = new Logger();
        const
            datacenterLocalApp = new DatacenterLocalApp(logger),
            instance = axios.create({
                validateStatus: () => true,
            }),
            proxiesMax = 2,
            requestsByProxies = 10,
            servers = new TestServers();
        let
            bytesReceived: number,
            bytesSent: number,
            ca: string,
            client: EventsConnectorsClient,
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

            client = new EventsConnectorsClient(commanderApp.events);

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
                ciphersShuffle: false,
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
                    proxiesMax,
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

            // Connect events
            const views = await commanderApp.frontendClient.getAllProjectConnectorsAndProxiesById(project.id);

            await commanderApp.events.registerAsync({
                scope: EEventScope.PROJECT,
                projectId: project.id,
            });
            await client.subscribeAsync(
                project.id,
                views
            );
        });

        afterAll(async() => {
            // Disconnect events
            await client.unsubscribeAsync();

            await commanderApp.stop();

            await Promise.all([
                masterApp.stop(), datacenterLocalApp.close(), servers.close(),
            ]);
        });

        it(
            'should make one request by proxies',
            async() => {
                for (let i = 0; i < proxiesMax; ++i) {
                    await instance.get(
                        `${servers.urlHttp}/file/big`,
                        {
                            headers: {
                                'Proxy-Authorization': `Basic ${token}`,
                            },
                            params: {
                                size: 10,
                            },
                            proxy: {
                                host: 'localhost',
                                port: masterApp.masterPort,
                                protocol: 'http',
                            },
                        }
                    );
                }

                await waitFor(() => {
                    const proxyFound = client.views[ 0 ].proxies[ 0 ];
                    expect(proxyFound.requests)
                        .toBe(1);
                    expect(proxyFound.requestsValid)
                        .toBe(1);
                    expect(proxyFound.requestsInvalid)
                        .toBe(0);

                    bytesReceived = proxyFound.bytesReceived;
                    bytesSent = proxyFound.bytesSent;
                });

                const view = await commanderApp.frontendClient.getAllConnectorProxiesById(
                    project.id,
                    connector.id
                );
                const proxy = view.proxies[ 0 ];
                expect(proxy.requests)
                    .toBe(1);
                expect(proxy.requestsValid)
                    .toBe(1);
                expect(proxy.requestsInvalid)
                    .toBe(0);
                expect(proxy.bytesReceived)
                    .toBe(bytesReceived);
                expect(proxy.bytesSent)
                    .toBe(bytesSent);
            }
        );

        it(
            'should make others requests',
            async() => {
                for (let i = 0; i < proxiesMax * (requestsByProxies - 1); ++i) {
                    await instance.get(
                        `${servers.urlHttp}/file/big`,
                        {
                            headers: {
                                'Proxy-Authorization': `Basic ${token}`,
                            },
                            params: {
                                size: 10,
                            },
                            proxy: {
                                host: 'localhost',
                                port: masterApp.masterPort,
                                protocol: 'http',
                            },
                        }
                    );
                }

                await waitFor(() => {
                    for (const proxy of client.views[ 0 ].proxies) {
                        expect(proxy.requests)
                            .toBe(10);
                        expect(proxy.requestsValid)
                            .toBe(10);
                        expect(proxy.requestsInvalid)
                            .toBe(0);
                        expect(proxy.bytesReceived)
                            .toBe(bytesReceived * requestsByProxies);
                        expect(proxy.bytesSent)
                            .toBe(bytesSent * requestsByProxies);
                    }
                });

                const view = await commanderApp.frontendClient.getAllConnectorProxiesById(
                    project.id,
                    connector.id
                );

                for (const proxy of view.proxies) {
                    expect(proxy.requests)
                        .toBe(10);
                    expect(proxy.requestsValid)
                        .toBe(10);
                    expect(proxy.requestsInvalid)
                        .toBe(0);
                    expect(proxy.bytesReceived)
                        .toBe(bytesReceived * requestsByProxies);
                    expect(proxy.bytesSent)
                        .toBe(bytesSent * requestsByProxies);
                }
            }
        );

        it(
            'should down scale to 1 proxy',
            async() => {
                await commanderApp.frontendClient.scaleConnector(
                    project.id,
                    connector.id,
                    1
                );

                await waitFor(() => {
                    expect(client.proxiesCount)
                        .toBe(1);
                });
            }
        );

        it(
            'should measure a progressive download with HTTP over HTTP proxy',
            async() => {
                const resPromise = instance.get(
                    `${servers.urlHttp}/file/slow`,
                    {
                        headers: {
                            'Proxy-Authorization': `Basic ${token}`,
                        },
                        params: {
                            size: 16384 * 30,
                            interval: 16384,
                            sleep: 100,
                        },
                        proxy: {
                            host: 'localhost',
                            port: masterApp.masterPort,
                            protocol: 'http',
                        },
                    }
                );

                await checkProgressiveMetrics(
                    commanderApp.frontendClient,
                    project.id,
                    connector.id
                );

                await resPromise;
            }
        );

        it(
            'should measure a progressive download with HTTPS over HTTP',
            async() => {
                const resPromise = instance.get(
                    `${servers.urlHttps}/file/slow`,
                    {
                        headers: {
                            'Proxy-Authorization': `Basic ${token}`,
                        },
                        params: {
                            size: 16384 * 30,
                            interval: 16384,
                            sleep: 100,
                        },
                        proxy: {
                            host: 'localhost',
                            port: masterApp.masterPort,
                            protocol: 'http',
                        },
                    }
                );

                await checkProgressiveMetrics(
                    commanderApp.frontendClient,
                    project.id,
                    connector.id
                );

                await resPromise;
            }
        );

        it(
            'should measure a progressive download with HTTPS over HTTP tunnel (MITM mode)',
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
                    const resPromise = instance.get(
                        `${servers.urlHttps}/file/slow`,
                        {
                            params: {
                                size: 16384 * 30,
                                interval: 16384,
                                sleep: 100,
                            },
                            httpsAgent,
                        }
                    );

                    await checkProgressiveMetrics(
                        commanderApp.frontendClient,
                        project.id,
                        connector.id
                    );

                    await resPromise;
                } finally {
                    httpsAgent.close();
                }
            }
        );

        it(
            'should measure a progressive download with HTTPS over HTTP tunnel (tunnel mode)',
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
                    const resPromise = instance.get(
                        `${servers.urlHttps}/file/slow`,
                        {
                            params: {
                                size: 16384 * 30,
                                interval: 16384,
                                sleep: 100,
                            },
                            httpsAgent,
                        }
                    );

                    await checkProgressiveMetrics(
                        commanderApp.frontendClient,
                        project.id,
                        connector.id
                    );

                    await resPromise;
                } finally {
                    httpsAgent.close();
                }
            }
        );
    }
);
