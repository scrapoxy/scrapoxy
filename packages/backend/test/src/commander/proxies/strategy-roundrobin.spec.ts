import { Logger } from '@nestjs/common';
import {
    DatacenterLocalApp,
    SUBSCRIPTION_LOCAL_DEFAULTS,
} from '@scrapoxy/backend-sdk';
import {
    CommanderApp,
    MasterApp,
    TestServers,
    waitFor,
} from '@scrapoxy/backend-test-sdk';
import {
    CONNECTOR_DATACENTER_LOCAL_TYPE,
    EEventScope,
    EventsConnectorsClient,
    ONE_MINUTE_IN_MS,
    PROXY_TIMEOUT_DISCONNECTED_DEFAULT_TEST,
    PROXY_TIMEOUT_UNREACHABLE_DEFAULT,
    randomName,
    SCRAPOXY_HEADER_PREFIX_LC,
} from '@scrapoxy/common';
import axios from 'axios';
import { v4 as uuid } from 'uuid';
import type {
    IConnectorDatacenterLocalConfig,
    IConnectorDatacenterLocalCredential,
} from '@scrapoxy/backend-sdk';
import type {
    ICredentialView,
    IProjectData,
    ISubscriptionDatacenterLocalToCreate,
} from '@scrapoxy/common';


describe(
    'Commander - Proxies - Strategy - Round-robin',
    () => {
        const logger = new Logger();
        const
            datacenterLocalApp = new DatacenterLocalApp(logger),
            instance = axios.create({
                validateStatus: () => true,
            }),
            parallelRequestsCount = 100,
            sequentialRequestsCount = 100,
            servers = new TestServers();
        let
            client: EventsConnectorsClient,
            commanderApp: CommanderApp,
            credentials: ICredentialView[],
            masterApp: MasterApp,
            project: IProjectData,
            token: string;

        beforeAll(async() => {
            // Start target & local connector
            await Promise.all([
                servers.listen(), datacenterLocalApp.start(),
            ]);

            const subscriptions: ISubscriptionDatacenterLocalToCreate[] = [
                {
                    id: uuid(),
                    ...SUBSCRIPTION_LOCAL_DEFAULTS,
                },
                {
                    id: uuid(),
                    ...SUBSCRIPTION_LOCAL_DEFAULTS,
                },
            ];
            const promisesSubscriptions = subscriptions.map((s) => datacenterLocalApp.client.createSubscription(s));
            await Promise.all(promisesSubscriptions);

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
            });

            // Create credential
            const credentialConfigs: IConnectorDatacenterLocalCredential[] = subscriptions.map((s) => ({
                subscriptionId: s.id,
            }));
            const promisesCredentials = credentialConfigs.map((cfg) => commanderApp.frontendClient.createCredential(
                project.id,
                {
                    name: randomName(),
                    type: CONNECTOR_DATACENTER_LOCAL_TYPE,
                    config: cfg,
                }
            ));
            credentials = await Promise.all(promisesCredentials);

            await waitFor(async() => {
                const promises = credentials.map((c) => commanderApp.frontendClient.getCredentialById(
                    project.id,
                    c.id
                ));

                await Promise.all(promises);

                token = await commanderApp.frontendClient.getProjectTokenById(project.id);
            });

            // Connect events
            await commanderApp.events.registerAsync({
                scope: EEventScope.PROJECT,
                projectId: project.id,
            });
            await client.subscribeAsync(
                project.id,
                []
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
            'should make a request without proxy',
            async() => {
                const res = await instance.get(
                    `${servers.urlHttp}/file/big`,
                    {
                        params: {
                            size: 1024,
                        },
                    }
                );

                expect(res.status)
                    .toBe(200);
                expect(res.headers[ `${SCRAPOXY_HEADER_PREFIX_LC}-proxyname` ])
                    .toBeUndefined();
            }
        );

        it(
            'should not make a request with no proxy',
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
                expect(res.statusText)
                    .toBe('no_proxy');
                expect(res.data.id)
                    .toBe('no_proxy');
                expect(res.data.message)
                    .toEqual(expect.stringContaining('Cannot find any proxy (projectId='));
            }
        );

        it(
            'should create, install and activate 2 connectors and 2 proxies by connector',
            async() => {
                const connectorConfigs: IConnectorDatacenterLocalConfig[] = [
                    {
                        region: 'europe',
                        size: 'small',
                        imageId: void 0,
                    },
                    {
                        region: 'asia',
                        size: 'large',
                        imageId: void 0,
                    },
                ];
                const promises = connectorConfigs.map(async(
                    cfg, i
                ) => {
                    const connector = await commanderApp.frontendClient.createConnector(
                        project.id,
                        {
                            name: randomName(),
                            credentialId: credentials[ i ].id,
                            proxiesMax: 2,
                            proxiesTimeoutDisconnected: PROXY_TIMEOUT_DISCONNECTED_DEFAULT_TEST,
                            proxiesTimeoutUnreachable: {
                                enabled: true,
                                value: PROXY_TIMEOUT_UNREACHABLE_DEFAULT,
                            },
                            config: cfg,
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
                });

                await Promise.all(promises);

                await waitFor(() => {
                    expect(client.proxiesOnlineCount)
                        .toBe(4);
                });
            }
        );

        it(
            'should make multiple sequential requests',
            async() => {
                for (let i = 0; i < sequentialRequestsCount; ++i) {
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

                let bytesReceived: number | undefined = void 0;
                await waitFor(() => {
                    expect(client.views)
                        .toHaveLength(2);

                    for (const proxyFound of client.proxies) {
                        expect(proxyFound.requests)
                            .toBe(sequentialRequestsCount / 4);
                        expect(proxyFound.bytesSent)
                            .toBe(0);

                        if (bytesReceived) {
                            expect(proxyFound.bytesReceived)
                                .toBe(bytesReceived);
                        } else {
                            expect(proxyFound.bytesReceived)
                                .toBeGreaterThan(0);
                            bytesReceived = proxyFound.bytesReceived;
                        }
                    }
                });

                const views = await commanderApp.frontendClient.getAllProjectConnectorsAndProxiesById(project.id);
                expect(views)
                    .toHaveLength(2);

                for (const view of views) {
                    for (const proxyFound of view.proxies) {
                        expect(proxyFound.requests)
                            .toBe(sequentialRequestsCount / 4);
                        expect(proxyFound.bytesSent)
                            .toBe(0);
                        expect(proxyFound.bytesReceived)
                            .toBe(bytesReceived);
                    }
                }
            }
        );

        it(
            'should make multiple parallel requests',
            async() => {
                const totalRequestsCount = sequentialRequestsCount + parallelRequestsCount;
                const promises: Promise<void>[] = [];
                for (let i = 0; i < parallelRequestsCount; ++i) {
                    promises.push(instance.get(
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
                    ));
                }

                await Promise.all(promises);

                await waitFor(() => {
                    expect(client.views)
                        .toHaveLength(2);

                    let requestsTotal = 0;
                    for (const proxyFound of client.proxies) {
                        expect(proxyFound.requests)
                            .toBeGreaterThanOrEqual(10);

                        expect(proxyFound.bytesSent)
                            .toBe(0);

                        requestsTotal += proxyFound.requests;
                    }

                    expect(requestsTotal)
                        .toBe(totalRequestsCount);
                });
            }
        );
    }
);
