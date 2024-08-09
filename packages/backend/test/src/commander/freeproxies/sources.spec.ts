import { Logger } from '@nestjs/common';
import { ConnectorFreeproxiesModule } from '@scrapoxy/backend-connectors';
import { ProxyHttp } from '@scrapoxy/backend-sdk';
import {
    CommanderApp,
    MasterApp,
    TestServers,
    waitFor,
} from '@scrapoxy/backend-test-sdk';
import {
    CONNECTOR_FREEPROXIES_TYPE,
    EProxyType,
    EventsFreeproxiesClient,
    ISourcesAndFreeproxies,
    ONE_MINUTE_IN_MS,
    ONE_SECOND_IN_MS,
    PROXY_TIMEOUT_DISCONNECTED_DEFAULT_TEST,
    PROXY_TIMEOUT_UNREACHABLE_DEFAULT,
} from '@scrapoxy/common';
import axios from 'axios';
import type {
    IConnectorView,
    ICredentialView,
    IProjectData,
} from '@scrapoxy/common';


describe(
    'Commander - Freeproxies - Sources',
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
            masterApp: MasterApp,
            project: IProjectData,
            sourcesandfreeproxies: ISourcesAndFreeproxies;

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
            });

            // Create connector
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
                    config: {
                        freeproxiesTimeoutDisconnected: PROXY_TIMEOUT_DISCONNECTED_DEFAULT_TEST + 1,
                        freeproxiesTimeoutUnreachable: {
                            enabled: false,
                            value: PROXY_TIMEOUT_UNREACHABLE_DEFAULT,
                        },
                    },
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
                {
                    sources: [],
                    freeproxies: [],
                }
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
            'should add a source and queries for proxies',
            async() => {
                await instance.post(
                    `${servers.urlHttp}/remember`,
                    {
                        type: 'text/plain',
                        content: `http://localhost:${proxy.port}`,
                    }
                );

                await commanderApp.frontendClient.createSources(
                    project.id,
                    connector.id,
                    [
                        {
                            url: `${servers.urlHttps}/remember`, // Keep HTTPs to check if TLS issues are ignored
                            delay: 10 * ONE_SECOND_IN_MS,
                        },
                    ]
                );

                await waitFor(() => {
                    expect(client.sources)
                        .toHaveLength(1);

                    const source = client.sources[ 0 ];
                    expect(source.url)
                        .toBe(`${servers.urlHttps}/remember`);
                    expect(source.delay)
                        .toBe(10 * ONE_SECOND_IN_MS);

                    expect(client.freeproxies)
                        .toHaveLength(1);

                    const freeproxy = client.freeproxies[ 0 ];
                    expect(freeproxy.type)
                        .toBe(EProxyType.HTTP);
                    expect(freeproxy.address)
                        .toEqual({
                            hostname: 'localhost',
                            port: proxy.port,
                        });
                });

                sourcesandfreeproxies = await commanderApp.frontendClient.getAllProjectSourcesAndFreeproxiesById(
                    project.id,
                    connector.id
                );

                expect(sourcesandfreeproxies.sources)
                    .toHaveLength(1);

                const source = sourcesandfreeproxies.sources[ 0 ];
                expect(source.url)
                    .toBe(`${servers.urlHttps}/remember`);
                expect(source.delay)
                    .toBe(10 * ONE_SECOND_IN_MS);

                expect(sourcesandfreeproxies.freeproxies)
                    .toHaveLength(1);

                const freeproxy = sourcesandfreeproxies.freeproxies[ 0 ];
                expect(freeproxy.type)
                    .toBe(EProxyType.HTTP);
                expect(freeproxy.address)
                    .toEqual({
                        hostname: 'localhost',
                        port: proxy.port,
                    });
            }
        );

        it(
            'should add a freeproxy in the source',
            async() => {
                await instance.post(
                    `${servers.urlHttp}/remember`,
                    {
                        type: 'text/plain',
                        content: 'socks5://1.2.3.4:1337',
                    }
                );

                await waitFor(
                    () => {
                        expect(client.freeproxies)
                            .toHaveLength(2);

                        const freeproxy = client.freeproxies.find((fp) => fp.address.hostname === '1.2.3.4');
                        expect(freeproxy).not.toBeUndefined();
                    },
                    20
                );

                sourcesandfreeproxies = await commanderApp.frontendClient.getAllProjectSourcesAndFreeproxiesById(
                    project.id,
                    connector.id
                );

                const freeproxy = sourcesandfreeproxies.freeproxies.find((fp) => fp.address.hostname === '1.2.3.4');
                expect(freeproxy).not.toBeUndefined();
            },
            20 * ONE_SECOND_IN_MS
        );

        it(
            'should remove the source',
            async() => {
                await commanderApp.frontendClient.removeSources(
                    project.id,
                    connector.id,
                    [
                        sourcesandfreeproxies.sources[ 0 ].id,
                    ]
                );

                await waitFor(() => {
                    expect(client.sources)
                        .toHaveLength(0);
                });

                sourcesandfreeproxies = await commanderApp.frontendClient.getAllProjectSourcesAndFreeproxiesById(
                    project.id,
                    connector.id
                );

                expect(sourcesandfreeproxies.sources)
                    .toHaveLength(0);
            }
        );
    }
);
