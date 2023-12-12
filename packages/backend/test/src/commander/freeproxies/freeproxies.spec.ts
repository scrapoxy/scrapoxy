import { Logger } from '@nestjs/common';
import { ProxyHttp } from '@scrapoxy/backend-sdk';
import {
    CommanderApp,
    MasterApp,
    TestServers,
    waitFor,
} from '@scrapoxy/backend-test-sdk';
import {
    countProxiesOnlineViews,
    EFreeproxyType,
    EventsFreeproxiesClient,
    ONE_MINUTE_IN_MS,
    ONE_SECOND_IN_MS,
} from '@scrapoxy/common';
import { ConnectorFreeproxiesModule } from '@scrapoxy/connector-freeproxies-backend';
import { CONNECTOR_FREEPROXIES_TYPE } from '@scrapoxy/connector-freeproxies-sdk';
import axios from 'axios';
import type {
    IConnectorView,
    ICredentialView,
    IFreeproxy,
    IProjectData,
} from '@scrapoxy/common';


describe(
    'Commander - Freeproxies',
    () => {
        const logger = new Logger();
        const
            instance = axios.create({
                validateStatus: () => true,
            }),
            proxy = new ProxyHttp(
                logger,
                ONE_MINUTE_IN_MS
            ),
            servers = new TestServers();
        let
            client: EventsFreeproxiesClient,
            commanderApp: CommanderApp,
            connector: IConnectorView,
            credential: ICredentialView,
            freeproxies: IFreeproxy[],
            masterApp: MasterApp,
            project: IProjectData,
            token: string;

        beforeAll(async() => {
            // Start target and proxy
            await Promise.all([
                servers.listen(), proxy.listen(),
            ]);

            // Start app
            commanderApp = CommanderApp.defaults({
                fingerprintUrl: servers.urlFingerprint,
                imports: [
                    ConnectorFreeproxiesModule,
                ],
                logger,
            });
            await commanderApp.start();

            client = new EventsFreeproxiesClient(commanderApp.events);

            masterApp = MasterApp.defaults({
                commanderApp,
                fingerprintUrl: servers.urlFingerprint,
                imports: [
                    ConnectorFreeproxiesModule,
                ],
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
            credential = await commanderApp.frontendClient.createCredential(
                project.id,
                {
                    name: 'mycredential',
                    type: CONNECTOR_FREEPROXIES_TYPE,
                    config: {},
                }
            );

            await waitFor(async() => {
                await commanderApp.frontendClient.getCredentialById(
                    project.id,
                    credential.id
                );

                token = await commanderApp.frontendClient.getProjectTokenById(project.id);
            });

            // Create connector
            connector = await commanderApp.frontendClient.createConnector(
                project.id,
                {
                    name: 'myconnector',
                    proxiesMax: 1,
                    credentialId: credential.id,
                    config: {},
                    certificateDurationInMs: 10 * ONE_MINUTE_IN_MS,
                }
            );

            await waitFor(async() => {
                await commanderApp.frontendClient.getConnectorById(
                    project.id,
                    connector.id
                );
            });

            // Connect events
            await client.subscribeAsync(
                project.id,
                connector.id,
                []
            );
        });

        afterAll(async() => {
            // Disconnect events
            await client.unsubscribeAsync();

            await commanderApp.stop();

            await Promise.all([
                masterApp.stop(), proxy.close(), servers.close(),
            ]);
        });

        it(
            'should add a proxy in freeproxies list',
            async() => {
                await commanderApp.frontendClient.createFreeproxies(
                    project.id,
                    connector.id,
                    [
                        {
                            type: EFreeproxyType.HTTP,
                            key: `localhost:${proxy.port}`,
                            address: {
                                hostname: 'localhost',
                                port: proxy.port as number,
                            },
                            auth: null,
                        },
                    ]
                );
            }
        );

        it(
            'should have one proxy online in freeproxies list',
            async() => {
                await waitFor(() => {
                    expect(client.freeproxies)
                        .toHaveLength(1);

                    const freeproxy = client.freeproxies[ 0 ];
                    expect(freeproxy.type)
                        .toBe(EFreeproxyType.HTTP);
                    expect(freeproxy.key)
                        .toBe(`localhost:${proxy.port}`);
                    expect(freeproxy.address)
                        .toEqual({
                            hostname: 'localhost',
                            port: proxy.port,
                        });
                    expect(freeproxy.auth)
                        .toBeNull();
                    expect(freeproxy.fingerprint).not.toBeNull();
                });

                await waitFor(async() => {
                    freeproxies = await commanderApp.frontendClient.getAllProjectFreeproxiesById(
                        project.id,
                        connector.id
                    );

                    expect(freeproxies)
                        .toHaveLength(1);

                    const freeproxy = freeproxies[ 0 ];
                    expect(freeproxy.type)
                        .toBe(EFreeproxyType.HTTP);
                    expect(freeproxy.key)
                        .toBe(`localhost:${proxy.port}`);
                    expect(freeproxy.address)
                        .toEqual({
                            hostname: 'localhost',
                            port: proxy.port,
                        });
                    expect(freeproxy.auth)
                        .toBeNull();
                    expect(freeproxy.fingerprint).not.toBeNull();
                });
            }
        );

        it(
            'should add an offline proxy',
            async() => {
                await commanderApp.frontendClient.createFreeproxies(
                    project.id,
                    connector.id,
                    [
                        {
                            type: EFreeproxyType.HTTP,
                            key: '1.2.3.4:1337',
                            address: {
                                hostname: '1.2.3.4',
                                port: 1337,
                            },
                            auth: null,
                        },
                    ]
                );

                await waitFor(() => {
                    expect(client.freeproxies)
                        .toHaveLength(2);
                });
            }
        );

        it(
            'should remove all offline proxies',
            async() => {
                await commanderApp.frontendClient.removeFreeproxies(
                    project.id,
                    connector.id,
                    {
                        ids: [],
                        onlyOffline: true,
                    }
                );

                await waitFor(() => {
                    expect(client.freeproxies)
                        .toHaveLength(1);
                });
            }
        );

        it(
            'should activate the connector',
            async() => {
                await commanderApp.frontendClient.activateConnector(
                    project.id,
                    connector.id,
                    true
                );

                await waitFor(
                    async() => {
                        const views = await commanderApp.frontendClient.getAllProjectConnectorsAndProxiesById(project.id);
                        expect(countProxiesOnlineViews(views))
                            .toBe(1);
                    },
                    20
                );
            },
            20 * ONE_SECOND_IN_MS
        );

        it(
            'should make a request',
            async() => {
                const res = await instance.get(
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

                expect(res.status)
                    .toBe(200);
            }
        );

        it(
            'should remove the proxy from freeproxies list',
            async() => {
                // Create and activate connector
                const ids = freeproxies.map((p) => p.id);
                await commanderApp.frontendClient.removeFreeproxies(
                    project.id,
                    connector.id,
                    {
                        ids,
                        onlyOffline: false,
                    }
                );
            }
        );

        it(
            'should have no proxy in freeproxies list',
            async() => {
                await waitFor(() => {
                    expect(client.freeproxies)
                        .toHaveLength(0);
                });

                await waitFor(async() => {
                    freeproxies = await commanderApp.frontendClient.getAllProjectFreeproxiesById(
                        project.id,
                        connector.id
                    );

                    expect(freeproxies)
                        .toHaveLength(0);
                });
            }
        );
    }
);
