import { Logger } from '@nestjs/common';
import { ConnectorFreeproxiesModule } from '@scrapoxy/backend-connectors';
import {
    CommanderApp,
    CommanderScraperClient,
    TestServers,
    USERAGENT_TEST,
    waitFor,
} from '@scrapoxy/backend-test-sdk';
import {
    CONNECTOR_FREEPROXIES_TYPE,
    EProxyType,
    IFreeproxy,
    ISource,
    ONE_DAY_IN_MS,
    ONE_MINUTE_IN_MS,
    PROXY_TIMEOUT_DISCONNECTED_DEFAULT_TEST,
    PROXY_TIMEOUT_UNREACHABLE_DEFAULT,
} from '@scrapoxy/common';
import type {
    IConnectorView,
    IProjectData,
} from '@scrapoxy/common';


describe(
    'Commander - Scrapers - Freeproxies',
    () => {
        const logger = new Logger();
        const servers = new TestServers();
        let
            client: CommanderScraperClient,
            commanderApp: CommanderApp,
            connector: IConnectorView,
            freeproxies: IFreeproxy[],
            project: IProjectData,
            sources: ISource[];

        beforeAll(async() => {
            // Start target
            await servers.listen();

            // Start app
            commanderApp = CommanderApp.defaults({
                fingerprintUrl: servers.urlFingerprint,
                imports: [
                    ConnectorFreeproxiesModule,
                ],
                logger,
            });
            await commanderApp.start();

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
            const credential = await commanderApp.frontendClient.createCredential(
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

                const token = await commanderApp.frontendClient.getProjectTokenById(project.id);
                client = new CommanderScraperClient(
                    commanderApp.url,
                    USERAGENT_TEST,
                    token
                );
            });

            // Create connector
            connector = await commanderApp.frontendClient.createConnector(
                project.id,
                {
                    name: 'myconnector',
                    proxiesMax: 4,
                    proxiesTimeoutDisconnected: PROXY_TIMEOUT_DISCONNECTED_DEFAULT_TEST,
                    proxiesTimeoutUnreachable: {
                        enabled: true,
                        value: PROXY_TIMEOUT_UNREACHABLE_DEFAULT,
                    },
                    credentialId: credential.id,
                    config: {
                        freeproxiesTimeoutDisconnected: PROXY_TIMEOUT_DISCONNECTED_DEFAULT_TEST,
                        freeproxiesTimeoutUnreachable: {
                            enabled: false,
                            value: 3000,
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
        });

        afterAll(async() => {
            await commanderApp.stop();

            await servers.close();
        });

        it(
            'should add a freeproxy',
            async() => {
                await client.createFreeproxies(
                    connector.id,
                    [
                        {
                            type: EProxyType.HTTP,
                            key: '1.2.3.4:1337',
                            address: {
                                hostname: '1.2.3.4',
                                port: 1337,
                            },
                            auth: {
                                username: 'myusername',
                                password: 'mypassword',
                            },
                        },
                    ]
                );

                await waitFor(async() => {
                    freeproxies = await client.getAllProjectFreeproxiesById(connector.id);
                    expect(freeproxies.length)
                        .toBe(1);

                    const freeproxy = freeproxies[ 0 ];
                    expect(freeproxy.type)
                        .toBe(EProxyType.HTTP);
                    expect(freeproxy.key)
                        .toBe('1.2.3.4:1337');
                    expect(freeproxy.address)
                        .toEqual({
                            hostname: '1.2.3.4',
                            port: 1337,
                        });
                    expect(freeproxy.auth)
                        .toEqual({
                            username: 'myusername',
                            password: 'mypassword',
                        });
                });
            }
        );

        it(
            'should remove a freeproxy',
            async() => {
                const ids = freeproxies.map((fp) => fp.id);
                await client.removeFreeproxies(
                    connector.id,
                    {
                        ids,
                    }
                );

                await waitFor(async() => {
                    freeproxies = await client.getAllProjectFreeproxiesById(connector.id);
                    expect(freeproxies.length)
                        .toBe(0);
                });
            }
        );

        it(
            'should add a source',
            async() => {
                await client.createSources(
                    connector.id,
                    [
                        {
                            url: 'http://notexist34912838123123.com',
                            delay: ONE_DAY_IN_MS,
                        },
                    ]
                );

                await waitFor(async() => {
                    sources = await client.getAllProjectSourcesById(connector.id);
                    expect(sources.length)
                        .toBe(1);

                    const source = sources[ 0 ];
                    expect(source.url)
                        .toBe('http://notexist34912838123123.com');
                    expect(source.delay)
                        .toBe(ONE_DAY_IN_MS);
                });
            }
        );

        it(
            'should remove a source',
            async() => {
                const ids = sources.map((s) => s.id);
                await client.removeSources(
                    connector.id,
                    ids
                );

                await waitFor(async() => {
                    sources = await client.getAllProjectSourcesById(connector.id);
                    expect(sources)
                        .toHaveLength(0);// TODO: transform all xxx.length to xxx.toHaveLength
                });
            }
        );
    }
);
