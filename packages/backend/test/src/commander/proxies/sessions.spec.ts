import { Logger } from '@nestjs/common';
import { ProxyLocalApp } from '@scrapoxy/backend-sdk';
import {
    CommanderApp,
    MasterApp,
    TestServers,
    waitFor,
} from '@scrapoxy/backend-test-sdk';
import {
    CONNECTOR_PROXY_LOCAL_TYPE,
    countProxiesOnlineViews,
    EProxyStatus,
    ONE_MINUTE_IN_MS,
    PROXY_TIMEOUT_DISCONNECTED_DEFAULT_TEST,
    PROXY_TIMEOUT_UNREACHABLE_DEFAULT,
} from '@scrapoxy/common';
import axios from 'axios';
import { v4 as uuid } from 'uuid';
import type {
    IConnectorProxyLocalConfig,
    IConnectorProxyLocalCredential,
} from '@scrapoxy/backend-sdk';
import type {
    IConnectorView,
    ICredentialView,
    IProjectData,
} from '@scrapoxy/common';


describe(
    'Commander - Proxies - Sessions',
    () => {
        const logger = new Logger();
        const
            instance = axios.create({
                validateStatus: () => true,
            }),
            proxyLocalToken = btoa(uuid()),
            servers = new TestServers();
        const proxyLocalApp = new ProxyLocalApp(
            logger,
            ONE_MINUTE_IN_MS,
            proxyLocalToken
        );
        let
            commanderApp: CommanderApp,
            connector: IConnectorView,
            credential: ICredentialView,
            masterApp: MasterApp,
            project: IProjectData,
            token: string;

        beforeAll(async() => {
            // Start target & local datacenter
            await Promise.all([
                servers.listen(), proxyLocalApp.listen(),
            ]);

            // Start app
            commanderApp = CommanderApp.defaults({
                fingerprintUrl: servers.urlFingerprint,
                logger,
                proxyLocalAppUrl: proxyLocalApp.url,
            });
            await commanderApp.start();
            masterApp = MasterApp.defaults({
                commanderApp,
                fingerprintUrl: servers.urlFingerprint,
                proxyLocalAppUrl: proxyLocalApp.url,
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
            const credentialConfig: IConnectorProxyLocalCredential = {
                token: proxyLocalToken,
            };
            credential = await commanderApp.frontendClient.createCredential(
                project.id,
                {
                    name: 'mycredential',
                    type: CONNECTOR_PROXY_LOCAL_TYPE,
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
        });

        afterAll(async() => {
            await commanderApp.stop();

            await Promise.all([
                masterApp.stop(), proxyLocalApp.close(), servers.close(),
            ]);
        });

        it(
            'should create and activate connector in asia',
            async() => {
                const connectorConfig: IConnectorProxyLocalConfig = {
                    region: 'asia',
                };
                connector = await commanderApp.frontendClient.createConnector(
                    project.id,
                    {
                        name: 'my asian connector',
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

                await waitFor(async() => {
                    await commanderApp.frontendClient.activateConnector(
                        project.id,
                        connector.id,
                        true
                    );
                });

                await waitFor(async() => {
                    const views = await commanderApp.frontendClient.getAllProjectConnectorsAndProxiesById(project.id);
                    expect(countProxiesOnlineViews(views))
                        .toBe(2);
                });

                await waitFor(async() => {
                    const views = await commanderApp.frontendClient.getAllConnectorProxiesSyncById(
                        project.id,
                        connector.id
                    );
                    expect(views.proxies)
                        .toHaveLength(2);

                    for (const proxy of views.proxies) {
                        expect(proxy.status)
                            .toBe(EProxyStatus.STARTED);

                        expect(proxy.fingerprint?.continentName)
                            .toBe('asia');
                    }
                });
            }
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
            'should create and activate connector in europe',
            async() => {
                const connectorConfig: IConnectorProxyLocalConfig = {
                    region: 'europe',
                };
                const connector2 = await commanderApp.frontendClient.createConnector(
                    project.id,
                    {
                        name: 'my european connector',
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

                await waitFor(async() => {
                    await commanderApp.frontendClient.activateConnector(
                        project.id,
                        connector2.id,
                        true
                    );
                });

                await waitFor(async() => {
                    const views = await commanderApp.frontendClient.getAllProjectConnectorsAndProxiesById(project.id);
                    expect(countProxiesOnlineViews(views))
                        .toBe(4);
                });

                await waitFor(async() => {
                    const views = await commanderApp.frontendClient.getAllConnectorProxiesSyncById(
                        project.id,
                        connector2.id
                    );
                    expect(views.proxies)
                        .toHaveLength(2);

                    for (const proxy of views.proxies) {
                        expect(proxy.status)
                            .toBe(EProxyStatus.STARTED);

                        expect(proxy.fingerprint?.continentName)
                            .toBe('europe');
                    }
                });
            }
        );
    }
);
