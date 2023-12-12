import { Logger } from '@nestjs/common';
import { readCaCert } from '@scrapoxy/backend-sdk';
import {
    AgentProxyHttpsTunnel,
    CommanderApp,
    MasterApp,
    TestServers,
    waitFor,
} from '@scrapoxy/backend-test-sdk';
import {
    CloudlocalApp,
    SUBSCRIPTION_LOCAL_DEFAULTS,
} from '@scrapoxy/cloudlocal';
import {
    countProxiesOnlineViews,
    ONE_MINUTE_IN_MS,
    SCRAPOXY_HEADER_PREFIX,
    SCRAPOXY_HEADER_PREFIX_LC,
} from '@scrapoxy/common';
import { CONNECTOR_CLOUDLOCAL_TYPE } from '@scrapoxy/connector-cloudlocal-sdk';
import axios from 'axios';
import { v4 as uuid } from 'uuid';
import type {
    IConnectorView,
    IProjectData,
} from '@scrapoxy/common';
import type {
    IConnectorCloudlocalConfig,
    IConnectorCloudlocalCredential,
} from '@scrapoxy/connector-cloudlocal-backend';
import type { RawAxiosRequestHeaders } from 'axios';
import type { OutgoingHttpHeaders } from 'http';


describe(
    'Commander - Proxies - Headers',
    () => {
        const logger = new Logger();
        const
            cloudlocalApp = new CloudlocalApp(logger),
            instance = axios.create({
                validateStatus: () => true,
            }),
            servers = new TestServers(),
            subscriptionId = uuid();
        let
            ca: string,
            commanderApp: CommanderApp,
            connector: IConnectorView,
            masterApp: MasterApp,
            project: IProjectData,
            token: string;

        beforeAll(async() => {
            // Get CA certificate
            ca = await readCaCert();

            // Start target & local connector
            await Promise.all([
                servers.listen(), cloudlocalApp.start(),
            ]);

            await cloudlocalApp.client.createSubscription({
                id: subscriptionId,
                ...SUBSCRIPTION_LOCAL_DEFAULTS,
            });

            // Start app
            commanderApp = CommanderApp.defaults({
                cloudlocalAppUrl: cloudlocalApp.url,
                fingerprintUrl: servers.urlFingerprint,
                logger,
            });
            await commanderApp.start();
            masterApp = MasterApp.defaults({
                cloudlocalAppUrl: cloudlocalApp.url,
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
            const credentialConfig: IConnectorCloudlocalCredential = {
                subscriptionId,
            };
            const credential = await commanderApp.frontendClient.createCredential(
                project.id,
                {
                    name: 'mycredential',
                    type: CONNECTOR_CLOUDLOCAL_TYPE,
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
            const connectorConfig: IConnectorCloudlocalConfig = {
                region: 'europe',
                size: 'small',
                imageId: void 0,
            };
            connector = await commanderApp.frontendClient.createConnector(
                project.id,
                {
                    name: 'myconnector',
                    proxiesMax: 1,
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
                const connectorConfigFound = connectorFound.config as IConnectorCloudlocalConfig;
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
                masterApp.stop(), cloudlocalApp.close(), servers.close(),
            ]);
        });

        it(
            'should force route with HTTP over HTTP',
            async() => {
                const view = await commanderApp.frontendClient.getAllConnectorProxiesSyncById(
                    project.id,
                    connector.id
                );
                const proxy = view.proxies[ 0 ];
                const headers: RawAxiosRequestHeaders = {
                    'Proxy-Authorization': `Basic ${token}`,
                };
                headers[ `${SCRAPOXY_HEADER_PREFIX}-Proxyname` ] = proxy.id;
                headers[ `${SCRAPOXY_HEADER_PREFIX}-DummyField` ] = 'dummyValue';

                const res = await instance.get(
                    `${servers.urlHttp}/mirror/headers`,
                    {
                        headers,
                        proxy: {
                            host: 'localhost',
                            port: masterApp.masterPort,
                            protocol: 'http',
                        },
                    }
                );

                expect(res.data).not.toHaveProperty('proxy-authorization');

                for (const header of Object.keys(res.data)) {
                    expect(header.toLowerCase()).not.toContain(SCRAPOXY_HEADER_PREFIX_LC);
                }
            }
        );

        it(
            'should force route with HTTPS over HTTP',
            async() => {
                const view = await commanderApp.frontendClient.getAllConnectorProxiesSyncById(
                    project.id,
                    connector.id
                );
                const proxy = view.proxies[ 0 ];
                const headers: RawAxiosRequestHeaders = {
                    'Proxy-Authorization': `Basic ${token}`,
                };
                headers[ `${SCRAPOXY_HEADER_PREFIX}-Proxyname` ] = proxy.id;
                headers[ `${SCRAPOXY_HEADER_PREFIX}-DummyField` ] = 'dummyValue';

                const res = await instance.get(
                    `${servers.urlHttps}/mirror/headers`,
                    {
                        headers,
                        proxy: {
                            host: 'localhost',
                            port: masterApp.masterPort,
                            protocol: 'http',
                        },
                    }
                );

                expect(res.data).not.toHaveProperty('proxy-authorization');

                for (const header of Object.keys(res.data)) {
                    expect(header.toLowerCase()).not.toContain(SCRAPOXY_HEADER_PREFIX_LC);
                }
            }
        );

        it(
            'should force route with HTTPS over HTTP tunnel (MITM mode)',
            async() => {
                const view = await commanderApp.frontendClient.getAllConnectorProxiesSyncById(
                    project.id,
                    connector.id
                );
                const proxy = view.proxies[ 0 ];
                const httpsAgent = new AgentProxyHttpsTunnel({
                    hostname: 'localhost',
                    port: masterApp.masterPort,
                    ca,
                    headers: {
                        'Proxy-Authorization': `Basic ${token}`,
                    },
                });

                try {
                    const headers: RawAxiosRequestHeaders = {};
                    headers[ `${SCRAPOXY_HEADER_PREFIX}-Proxyname` ] = proxy.id;
                    headers[ `${SCRAPOXY_HEADER_PREFIX}-DummyField` ] = 'dummyValue';

                    const res = await instance.get(
                        `${servers.urlHttps}/mirror/headers`,
                        {
                            httpsAgent,
                            headers,
                        }
                    );

                    expect(res.data).not.toHaveProperty('proxy-authorization');

                    for (const header of Object.keys(res.data)) {
                        expect(header.toLowerCase()).not.toContain(SCRAPOXY_HEADER_PREFIX_LC);
                    }
                } finally {
                    httpsAgent.close();
                }
            }
        );

        it(
            'should force route with HTTPS over HTTP tunnel (tunnel mode)',
            async() => {
                const view = await commanderApp.frontendClient.getAllConnectorProxiesSyncById(
                    project.id,
                    connector.id
                );
                const proxy = view.proxies[ 0 ];
                const headersConnect: OutgoingHttpHeaders = {
                    'Proxy-Authorization': `Basic ${token}`,
                };
                headersConnect[ `${SCRAPOXY_HEADER_PREFIX}-Mode` ] = 'tunnel';
                headersConnect[ `${SCRAPOXY_HEADER_PREFIX}-Proxyname` ] = proxy.id;

                const httpsAgent = new AgentProxyHttpsTunnel({
                    hostname: 'localhost',
                    port: masterApp.masterPort,
                    headers: headersConnect,
                });

                try {
                    const headers: RawAxiosRequestHeaders = {};
                    headers[ `${SCRAPOXY_HEADER_PREFIX}-DummyField` ] = 'dummyValue';

                    const res = await instance.get(
                        `${servers.urlHttps}/mirror/headers`,
                        {
                            httpsAgent,
                            headers,
                        }
                    );

                    expect(res.data).not.toHaveProperty('proxy-authorization');

                    // Because we cannot modify the headers in tunnel mode
                    expect(res.data)
                        .toHaveProperty(
                            `${SCRAPOXY_HEADER_PREFIX_LC}-dummyfield`,
                            'dummyValue'
                        );
                } finally {
                    httpsAgent.close();
                }
            }
        );
    }
);
