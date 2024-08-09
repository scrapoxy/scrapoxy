import { Logger } from '@nestjs/common';
import {
    DatacenterLocalApp,
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
    EventsMetricsClient,
    MetricsStore,
    ONE_MINUTE_IN_MS,
    ONE_SECOND_IN_MS,
    PROXY_TIMEOUT_DISCONNECTED_DEFAULT_TEST,
    PROXY_TIMEOUT_UNREACHABLE_DEFAULT,
    SCRAPOXY_HEADER_PREFIX,
} from '@scrapoxy/common';
import axios, { AxiosRequestConfig } from 'axios';
import { v4 as uuid } from 'uuid';
import type {
    IConnectorDatacenterLocalConfig,
    IConnectorDatacenterLocalCredential,
} from '@scrapoxy/backend-connectors';
import type {
    IConnectorView,
    ICredentialView,
    IProjectData,
    IProjectToCreate,
} from '@scrapoxy/common';
import type { OutgoingHttpHeaders } from 'http';


describe(
    'Commander - Proxies - Success rate',
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
                    enabled: false,
                    min: ONE_SECOND_IN_MS * 30,
                    max: ONE_SECOND_IN_MS * 30,
                },
                autoScaleUp: false,
                autoScaleDown: {
                    enabled: false,
                    value: ONE_SECOND_IN_MS * 30,
                },
                cookieSession: false,
                mitm: true,
                proxiesMin: 1,
                useragentOverride: false,
                ciphersShuffle: false,
            },
            servers = new TestServers();
        let
            commanderApp: CommanderApp,
            connector: IConnectorView,
            connectorsClient: EventsConnectorsClient,
            credential: ICredentialView,
            masterApp: MasterApp,
            metricsClient: EventsMetricsClient,
            project: IProjectData,
            token: string;

        async function makeRequests(
            url: string,
            expectedStatus: number,
            requests: number,
            requestsValid: number,
            requestsInvalid: number,
            mode?: string,
            count = 10
        ) {
            for (let i = 0; i < count; ++i) {
                const config: AxiosRequestConfig = {};
                let httpsAgent: AgentProxyHttpsTunnel | undefined;

                if (mode) {
                    const headersConnect: OutgoingHttpHeaders = {
                        'Proxy-Authorization': `Basic ${token}`,
                    };

                    if (mode === 'tunnel') {
                        headersConnect[ `${SCRAPOXY_HEADER_PREFIX}-Mode` ] = 'tunnel';
                    }

                    httpsAgent = new AgentProxyHttpsTunnel({
                        hostname: 'localhost',
                        port: masterApp.masterPort,
                        headers: headersConnect,
                    });

                    config.httpsAgent = httpsAgent;
                } else {
                    httpsAgent = void 0;

                    config.headers = {
                        'Proxy-Authorization': `Basic ${token}`,
                    };
                    config.proxy = {
                        host: 'localhost',
                        port: masterApp.masterPort,
                        protocol: 'http',
                    };
                }

                try {
                    const res = await instance.get(
                        url,
                        config
                    );

                    expect(res.status)
                        .toBe(expectedStatus);
                } finally {
                    if (httpsAgent) {
                        httpsAgent.close();
                    }
                }
            }

            await waitFor(() => {
                const store = metricsClient.store as MetricsStore;

                expect(store.view.project.requests)
                    .toBe(requests);
                expect(store.view.project.requestsValid)
                    .toBe(requestsValid);
                expect(store.view.project.requestsInvalid)
                    .toBe(requestsInvalid);

                for (const proxy of connectorsClient.proxies) {
                    expect(proxy.requests)
                        .toBe(requests / connectorsClient.proxies.length);
                    expect(proxy.requestsValid)
                        .toBe(requestsValid / connectorsClient.proxies.length);
                    expect(proxy.requestsInvalid)
                        .toBe(requestsInvalid / connectorsClient.proxies.length);
                }
            });

            const metrics = await commanderApp.frontendClient.getProjectMetricsById(project.id);

            expect(metrics.project.requests)
                .toBe(requests);
            expect(metrics.project.requestsValid)
                .toBe(requestsValid);
            expect(metrics.project.requestsInvalid)
                .toBe(requestsInvalid);

            const views = await commanderApp.frontendClient.getAllProjectConnectorsAndProxiesById(project.id);
            const view = views[ 0 ];
            for (const proxy of view.proxies) {
                expect(proxy.requests)
                    .toBe(requests / view.proxies.length);
                expect(proxy.requestsValid)
                    .toBe(requestsValid / view.proxies.length);
                expect(proxy.requestsInvalid)
                    .toBe(requestsInvalid / view.proxies.length);
            }
        }

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
            project = await commanderApp.frontendClient.createProject(projectToCreate);

            // Create credential
            const credentialConfig: IConnectorDatacenterLocalCredential = {
                subscriptionId,
            };

            credential = await commanderApp.frontendClient.createCredential(
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

            // Create, install and activate connector with 2 proxies
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
            });

            // Connect events
            const [
                metrics, views,
            ] = await Promise.all([
                commanderApp.frontendClient.getProjectMetricsById(project.id), commanderApp.frontendClient.getAllProjectConnectorsAndProxiesById(project.id),
            ]);

            await Promise.all([
                connectorsClient.subscribeAsync(
                    project.id,
                    views
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

        describe(
            'HTTP over HTTP proxy',
            () => {
                it(
                    'should make valid requests',
                    () => makeRequests(
                        `${servers.urlHttp}/mirror/headers`,
                        200,
                        10,
                        10,
                        0
                    )
                );

                it(
                    'should make invalid requests',
                    () => makeRequests(
                        `${servers.urlHttp}/mirror/notfound`,
                        404,
                        20,
                        10,
                        10
                    )
                );
            }
        );

        describe(
            'HTTPS over HTTP proxy',
            () => {
                it(
                    'should make valid requests',
                    () => makeRequests(
                        `${servers.urlHttps}/mirror/headers`,
                        200,
                        30,
                        20,
                        10
                    )
                );

                it(
                    'should make invalid requests',
                    () => makeRequests(
                        `${servers.urlHttps}/mirror/notfound`,
                        404,
                        40,
                        20,
                        20
                    )
                );
            }
        );

        describe(
            'HTTPS over HTTP proxy tunnel (MITM mode)',
            () => {
                it(
                    'should make valid requests',
                    () => makeRequests(
                        `${servers.urlHttps}/mirror/headers`,
                        200,
                        50,
                        30,
                        20,
                        'mitm'
                    )
                );

                it(
                    'should make invalid requests',
                    () => makeRequests(
                        `${servers.urlHttps}/mirror/notfound`,
                        404,
                        60,
                        30,
                        30,
                        'mitm'
                    )
                );
            }
        );

        describe(
            'HTTPS over HTTP proxy tunnel (tunnel mode)',
            () => {
                it(
                    'should make valid requests',
                    () => makeRequests(
                        `${servers.urlHttps}/mirror/headers`,
                        200,
                        70,
                        30,
                        30,
                        'tunnel'
                    )
                );

                it(
                    'should make invalid requests',
                    () => makeRequests(
                        `${servers.urlHttps}/mirror/notfound`,
                        404,
                        80,
                        30,
                        30,
                        'tunnel'
                    )
                );
            }
        );
    }
);
