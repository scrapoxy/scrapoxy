import { Logger } from '@nestjs/common';
import {
    ConnectorFreeproxiesModule,
    readCaCert,
} from '@scrapoxy/backend-sdk';
import {
    AgentProxyHttpsTunnel,
    CommanderApp,
    MasterApp,
    TestServers,
    waitFor,
} from '@scrapoxy/backend-test-sdk';
import {
    CONNECTOR_FREEPROXIES_TYPE,
    countProxiesOnlineViews,
    EventsFreeproxiesClient,
    IConnectorView,
    ICredentialView,
    IFreeproxy,
    IFreeproxyBase,
    IProjectData,
    ONE_MINUTE_IN_MS,
    ONE_SECOND_IN_MS,
    PROXY_TIMEOUT_DISCONNECTED_DEFAULT_TEST,
    SCRAPOXY_HEADER_PREFIX,
} from '@scrapoxy/common';
import axios from 'axios';
import type { OutgoingHttpHeaders } from 'http';


export function testProxy(
    jest: { beforeAll: any; afterAll: any; it: any; expect: any },
    logger: Logger,
    freeproxy: IFreeproxyBase
) {
    const
        instance = axios.create({
            validateStatus: () => true,
        }),
        servers = new TestServers();
    let
        ca: string,
        client: EventsFreeproxiesClient,
        commanderApp: CommanderApp,
        connector: IConnectorView,
        credential: ICredentialView,
        freeproxies: IFreeproxy[],
        masterApp: MasterApp,
        project: IProjectData,
        token: string;

    jest.beforeAll(async() => {
        // Get CA certificate
        ca = await readCaCert();

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
                proxiesTimeoutDisconnected: PROXY_TIMEOUT_DISCONNECTED_DEFAULT_TEST,
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

    jest.afterAll(async() => {
        // Disconnect events
        await client.unsubscribeAsync();

        await commanderApp.stop();

        await Promise.all([
            masterApp.stop(), servers.close(),
        ]);
    });

    jest.it(
        'should add a proxy in freeproxies list',
        async() => {
            await commanderApp.frontendClient.createFreeproxies(
                project.id,
                connector.id,
                [
                    freeproxy,
                ]
            );
        }
    );

    jest.it(
        'should have one proxy online in freeproxies list',
        async() => {
            await waitFor(() => {
                jest.expect(client.freeproxies)
                    .toHaveLength(1);

                const freeproxyFound = client.freeproxies[ 0 ];
                jest.expect(freeproxyFound.type)
                    .toBe(freeproxy.type);
                jest.expect(freeproxyFound.key)
                    .toBe(freeproxy.key);
                jest.expect(freeproxyFound.address)
                    .toEqual(freeproxy.address);
                jest.expect(freeproxyFound.auth)
                    .toEqual(freeproxy.auth);
                jest.expect(freeproxyFound.fingerprint).not.toBeNull();
            });

            await waitFor(async() => {
                freeproxies = await commanderApp.frontendClient.getAllProjectFreeproxiesById(
                    project.id,
                    connector.id
                );

                jest.expect(freeproxies)
                    .toHaveLength(1);

                const freeproxyFound = freeproxies[ 0 ];
                jest.expect(freeproxyFound.type)
                    .toBe(freeproxy.type);
                jest.expect(freeproxyFound.key)
                    .toBe(freeproxy.key);
                jest.expect(freeproxyFound.address)
                    .toEqual(freeproxy.address);
                jest.expect(freeproxyFound.auth)
                    .toEqual(freeproxy.auth);
                jest.expect(freeproxyFound.fingerprint).not.toBeNull();
            });
        }
    );

    jest.it(
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
                    jest.expect(countProxiesOnlineViews(views))
                        .toBe(1);
                },
                20
            );
        },
        20 * ONE_SECOND_IN_MS
    );

    jest.it(
        'should make a request with HTTP over HTTP proxy',
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

            jest.expect(res.status)
                .toBe(200);
        }
    );

    jest.it(
        'should make a request with HTTPS over HTTP proxy',
        async() => {
            const res = await instance.get(
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

            jest.expect(res.status)
                .toBe(200);
        }
    );

    jest.it(
        'should make a request with HTTPS over HTTP tunnel (MITM mode)',
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
                            'Proxy-Authorization': `Basic ${token}`,
                        },
                    }
                );

                jest.expect(res.status)
                    .toBe(200);
            } finally {
                httpsAgent.close();
            }
        }
    );

    jest.it(
        'should make a request with HTTPS over HTTP tunnel (tunnel mode)',
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
                    }
                );

                jest.expect(res.status)
                    .toBe(200);
            } finally {
                httpsAgent.close();
            }
        }
    );

    jest.it(
        'should not make a unknown protocol request',
        async() => {
            const res = await instance.get(
                'file://c:/windows/win.ini',
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

            jest.expect(res.status)
                .toBe(500);
            jest.expect(res.data.message)
                .toContain('Unsupported protocol: file:');
        }
    );

    jest.it(
        'should deactivate the connector',
        async() => {
            await commanderApp.frontendClient.activateConnector(
                project.id,
                connector.id,
                false
            );

            await waitFor(
                async() => {
                    const views = await commanderApp.frontendClient.getAllProjectConnectorsAndProxiesById(project.id);
                    jest.expect(countProxiesOnlineViews(views))
                        .toBe(0);
                },
                20
            );
        },
        20 * ONE_SECOND_IN_MS
    );

    jest.it(
        'should remove the proxy from freeproxies list',
        async() => {
            // Create and activate connector
            const ids = freeproxies.map((p) => p.id);
            await commanderApp.frontendClient.removeFreeproxies(
                project.id,
                connector.id,
                {
                    ids,
                    duplicate: false,
                    onlyOffline: false,
                }
            );
        }
    );

    jest.it(
        'should have no proxy in freeproxies list',
        async() => {
            await waitFor(() => {
                jest.expect(client.freeproxies)
                    .toHaveLength(0);
            });

            await waitFor(async() => {
                freeproxies = await commanderApp.frontendClient.getAllProjectFreeproxiesById(
                    project.id,
                    connector.id
                );

                jest.expect(freeproxies)
                    .toHaveLength(0);
            });
        }
    );
}
