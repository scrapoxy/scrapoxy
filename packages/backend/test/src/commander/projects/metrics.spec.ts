import { Logger } from '@nestjs/common';
import {
    DatacenterLocalApp,
    SUBSCRIPTION_LOCAL_DEFAULTS,
} from '@scrapoxy/backend-sdk';
import {
    CommanderApp,
    generateData,
    MasterApp,
    TestServers,
    waitFor,
} from '@scrapoxy/backend-test-sdk';
import {
    CONNECTOR_DATACENTER_LOCAL_TYPE,
    EEventScope,
    EventsConnectorsClient,
    EventsMetricsClient,
    MetricsStore,
    ONE_MINUTE_IN_MS,
    PROXY_TIMEOUT_DISCONNECTED_DEFAULT_TEST,
    PROXY_TIMEOUT_UNREACHABLE_DEFAULT,
    sleep,
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
} from '@scrapoxy/common';


describe(
    'Commander - Projects - Metrics',
    () => {
        const logger = new Logger();
        const
            datacenterLocalApp = new DatacenterLocalApp(logger),
            instance = axios.create({
                validateStatus: () => true,
            }),
            servers = new TestServers(),
            size = 1024;
        let
            commanderApp: CommanderApp,
            connector: IConnectorView,
            connectorsClient: EventsConnectorsClient,
            masterApp: MasterApp,
            metricsClient: EventsMetricsClient,
            project: IProjectData,
            token: string;

        beforeAll(async() => {
            // Start target & local connector
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

            connectorsClient = new EventsConnectorsClient(commanderApp.events);
            metricsClient = new EventsMetricsClient(commanderApp.events);

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

            const metrics = await commanderApp.frontendClient.getProjectMetricsById(project.id);

            // Connect events
            await Promise.all([
                connectorsClient.subscribeAsync(
                    project.id,
                    []
                ),
                metricsClient.subscribeAsync(
                    project.id,
                    MetricsStore.fromView(metrics)
                ),
                commanderApp.events.registerAsync({
                    scope: EEventScope.PROJECT,
                    projectId: project.id,
                }),
            ]);

            // Create and install connector
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
        });

        afterAll(async() => {
            // Disconnect events
            await Promise.all([
                metricsClient.unsubscribeAsync(), connectorsClient.unsubscribeAsync(),
            ]);

            await commanderApp.stop();

            await Promise.all([
                masterApp.stop(), datacenterLocalApp.close(), servers.close(),
            ]);
        });

        it(
            'should have empty metrics',
            async() => {
                await waitFor(() => {
                    const store = metricsClient.store as MetricsStore;

                    expect(store.view.project.requests)
                        .toBe(0);
                    expect(store.view.project.stops)
                        .toBe(0);
                    expect(store.view.project.bytesReceived)
                        .toBe(0);
                    expect(store.view.project.bytesSent)
                        .toBe(0);
                    expect(store.view.project.proxiesCreated)
                        .toBe(0);
                    expect(store.view.project.proxiesRemoved)
                        .toBe(0);
                    expect(store.view.project.requestsBeforeStop.sum)
                        .toBe(0);
                    expect(store.view.project.requestsBeforeStop.count)
                        .toBe(0);
                    expect(store.view.project.requestsBeforeStop.min)
                        .toBeUndefined();
                    expect(store.view.project.requestsBeforeStop.max)
                        .toBeUndefined();
                    expect(store.view.project.uptimeBeforeStop.sum)
                        .toBe(0);
                    expect(store.view.project.uptimeBeforeStop.count)
                        .toBe(0);
                    expect(store.view.project.uptimeBeforeStop.min)
                        .toBeUndefined();
                    expect(store.view.project.uptimeBeforeStop.max)
                        .toBeUndefined();
                });

                const metrics = await commanderApp.frontendClient.getProjectMetricsById(project.id);

                expect(metrics.project.requests)
                    .toBe(0);
                expect(metrics.project.stops)
                    .toBe(0);
                expect(metrics.project.bytesReceived)
                    .toBe(0);
                expect(metrics.project.bytesSent)
                    .toBe(0);
                expect(metrics.project.proxiesCreated)
                    .toBe(0);
                expect(metrics.project.proxiesRemoved)
                    .toBe(0);
                expect(metrics.project.requestsBeforeStop.sum)
                    .toBe(0);
                expect(metrics.project.requestsBeforeStop.count)
                    .toBe(0);
                expect(metrics.project.requestsBeforeStop.min)
                    .toBeUndefined();
                expect(metrics.project.requestsBeforeStop.max)
                    .toBeUndefined();
                expect(metrics.project.uptimeBeforeStop.sum)
                    .toBe(0);
                expect(metrics.project.uptimeBeforeStop.count)
                    .toBe(0);
                expect(metrics.project.uptimeBeforeStop.min)
                    .toBeUndefined();
                expect(metrics.project.uptimeBeforeStop.max)
                    .toBeUndefined();
            }
        );

        it(
            'should activate connector and start proxies',
            async() => {
                await commanderApp.frontendClient.activateConnector(
                    project.id,
                    connector.id,
                    true
                );

                await waitFor(() => {
                    expect(connectorsClient.proxiesOnlineCount)
                        .toBe(1);

                    expect(metricsClient.store?.view.project.proxiesCreated)
                        .toBe(1);
                });

                const metrics = await commanderApp.frontendClient.getProjectMetricsById(project.id);

                expect(metrics.project.proxiesCreated)
                    .toBe(1);

            }
        );

        it(
            'should download some content',
            async() => {
                for (let i = 0; i < 2; ++i) {
                    await instance.get(
                        `${servers.urlHttp}/file/big`,
                        {
                            headers: {
                                'Proxy-Authorization': `Basic ${token}`,
                            },
                            params: {
                                size: size,
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
                    const store = metricsClient.store as MetricsStore;

                    expect(store.view.project.requests)
                        .toBe(2);
                    expect(store.view.project.stops)
                        .toBe(0);
                    expect(store.view.project.bytesReceived)
                        .toBe(size * 2);
                    expect(store.view.project.bytesSent)
                        .toBe(0);
                });

                const metrics = await commanderApp.frontendClient.getProjectMetricsById(project.id);

                expect(metrics.project.requests)
                    .toBe(2);
                expect(metrics.project.stops)
                    .toBe(0);
                expect(metrics.project.bytesReceived)
                    .toBe(size * 2);
                expect(metrics.project.bytesSent)
                    .toBe(0);
            }
        );

        it(
            'should renew a proxy',
            async() => {
                const view = await commanderApp.frontendClient.getAllConnectorProxiesSyncById(
                    project.id,
                    connector.id
                );
                const proxy = view.proxies[ 0 ];

                await commanderApp.frontendClient.askProxiesToRemove(
                    project.id,
                    [
                        {
                            id: proxy.id, force: false,
                        },
                    ]
                );

                await waitFor(() => {
                    expect(connectorsClient.proxiesOnlineCount)
                        .toBe(1);

                    const store = metricsClient.store as MetricsStore;

                    expect(store.view.project.stops)
                        .toBe(1);
                    expect(store.view.project.proxiesCreated)
                        .toBe(2);
                    expect(store.view.project.proxiesRemoved)
                        .toBe(1);
                    expect(store.view.project.requestsBeforeStop.sum)
                        .toBe(2);
                    expect(store.view.project.requestsBeforeStop.count)
                        .toBe(1);
                    expect(store.view.project.requestsBeforeStop.min)
                        .toBe(2);
                    expect(store.view.project.requestsBeforeStop.max)
                        .toBe(2);
                    expect(store.view.project.uptimeBeforeStop.sum)
                        .toBeGreaterThan(0);
                    expect(store.view.project.uptimeBeforeStop.count)
                        .toBe(store.view.project.requestsBeforeStop.count);
                    expect(store.view.project.uptimeBeforeStop.min)
                        .toBeGreaterThan(0);
                    expect(store.view.project.uptimeBeforeStop.max)
                        .toBe(store.view.project.uptimeBeforeStop.min);
                });

                const metrics = await commanderApp.frontendClient.getProjectMetricsById(project.id);

                expect(metrics.project.stops)
                    .toBe(1);
                expect(metrics.project.proxiesCreated)
                    .toBe(2);
                expect(metrics.project.proxiesRemoved)
                    .toBe(1);
                expect(metrics.project.requestsBeforeStop.sum)
                    .toBe(2);
                expect(metrics.project.requestsBeforeStop.count)
                    .toBe(1);
                expect(metrics.project.requestsBeforeStop.min)
                    .toBe(2);
                expect(metrics.project.requestsBeforeStop.max)
                    .toBe(2);
                expect(metrics.project.uptimeBeforeStop.sum)
                    .toBeGreaterThan(0);

                const store = metricsClient.store as MetricsStore;

                expect(metrics.project.uptimeBeforeStop.count)
                    .toBe(store.view.project.requestsBeforeStop.count);
                expect(metrics.project.uptimeBeforeStop.min)
                    .toBeGreaterThan(0);
                expect(metrics.project.uptimeBeforeStop.max)
                    .toBe(store.view.project.uptimeBeforeStop.min);
            }
        );

        it(
            'should upload some content',
            async() => {
                for (let i = 0; i < 2; ++i) {
                    await instance.post(
                        `${servers.urlHttp}/file/big`,
                        generateData(size),
                        {
                            params: {
                                size: size,
                            },
                            headers: {
                                'Proxy-Authorization': `Basic ${token}`,
                                'Content-Type': 'application/octet-stream',
                                'Content-Length': size.toString(),
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
                    const store = metricsClient.store as MetricsStore;

                    expect(store.view.project.requests)
                        .toBe(4);
                    expect(store.view.project.bytesReceived)
                        .toBe(size * 2);
                    expect(store.view.project.bytesSent)
                        .toBe(size * 2);
                });

                const metrics = await commanderApp.frontendClient.getProjectMetricsById(project.id);

                expect(metrics.project.requests)
                    .toBe(4);
                expect(metrics.project.bytesReceived)
                    .toBe(size * 2);
                expect(metrics.project.bytesSent)
                    .toBe(size * 2);
            }
        );

        it(
            'should renew again a proxy',
            async() => {
                await sleep(1000);

                const view = await commanderApp.frontendClient.getAllConnectorProxiesSyncById(
                    project.id,
                    connector.id
                );
                const proxy = view.proxies[ 0 ];

                await commanderApp.frontendClient.askProxiesToRemove(
                    project.id,
                    [
                        {
                            id: proxy.id, force: false,
                        },
                    ]
                );

                await waitFor(() => {
                    expect(connectorsClient.proxiesOnlineCount)
                        .toBe(1);

                    const store = metricsClient.store as MetricsStore;

                    expect(store.view.project.stops)
                        .toBe(2);
                    expect(store.view.project.proxiesCreated)
                        .toBe(3);
                    expect(store.view.project.proxiesRemoved)
                        .toBe(2);
                    expect(store.view.project.requestsBeforeStop.sum)
                        .toBe(4);
                    expect(store.view.project.requestsBeforeStop.count)
                        .toBe(2);
                    expect(store.view.project.requestsBeforeStop.min)
                        .toBe(2);
                    expect(store.view.project.requestsBeforeStop.max)
                        .toBe(2);
                    expect(store.view.project.uptimeBeforeStop.sum)
                        .toBeGreaterThan(0);
                    expect(store.view.project.uptimeBeforeStop.count)
                        .toBe(store.view.project.requestsBeforeStop.count);
                    expect(store.view.project.uptimeBeforeStop.min)
                        .toBeGreaterThan(0);
                    expect(store.view.project.uptimeBeforeStop.max)
                        .toBeGreaterThanOrEqual(store.view.project.uptimeBeforeStop.min as number);
                });

                const metrics = await commanderApp.frontendClient.getProjectMetricsById(project.id);

                expect(metrics.project.stops)
                    .toBe(2);
                expect(metrics.project.proxiesCreated)
                    .toBe(3);
                expect(metrics.project.proxiesRemoved)
                    .toBe(2);
                expect(metrics.project.requestsBeforeStop.sum)
                    .toBe(4);
                expect(metrics.project.requestsBeforeStop.count)
                    .toBe(2);
                expect(metrics.project.requestsBeforeStop.min)
                    .toBe(2);
                expect(metrics.project.requestsBeforeStop.max)
                    .toBe(2);
                expect(metrics.project.uptimeBeforeStop.sum)
                    .toBeGreaterThan(0);

                const store = metricsClient.store as MetricsStore;

                expect(metrics.project.uptimeBeforeStop.count)
                    .toBe(store.view.project.requestsBeforeStop.count);
                expect(metrics.project.uptimeBeforeStop.min)
                    .toBeGreaterThan(0);
                expect(metrics.project.uptimeBeforeStop.max)
                    .toBeGreaterThanOrEqual(store.view.project.uptimeBeforeStop.min as number);
            }
        );
    }
);
