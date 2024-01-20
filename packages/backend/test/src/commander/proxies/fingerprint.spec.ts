import { Logger } from '@nestjs/common';
import {
    CommanderApp,
    DEFAULT_FINGERPRINT,
    MasterApp,
    TestServers,
    VERSION_TEST,
    waitFor,
} from '@scrapoxy/backend-test-sdk';
import {
    countProxiesOnlineViews,
    ONE_MINUTE_IN_MS,
    SCRAPOXY_USER_AGENT_PREFIX,
} from '@scrapoxy/common';
import {
    CONNECTOR_DATACENTER_LOCAL_TYPE,
    EDatacenterLocalQueryCredential,
} from '@scrapoxy/connector-datacenter-local-sdk';
import {
    DatacenterLocalApp,
    SUBSCRIPTION_LOCAL_DEFAULTS,
} from '@scrapoxy/datacenter-local';
import axios from 'axios';
import { v4 as uuid } from 'uuid';
import type {
    IConnectorView,
    ICredentialView,
    IFingerprint,
    IProjectData,
} from '@scrapoxy/common';
import type {
    IConnectorDatacenterLocalConfig,
    IConnectorDatacenterLocalCredential,
} from '@scrapoxy/connector-datacenter-local-backend';
import type {
    IDatacenterLocalQueryRegionSizes,
    IRegionDatacenterLocal,
    IRegionSizeDatacenterLocal,
} from '@scrapoxy/connector-datacenter-local-sdk';


async function installConnector(
    projectId: string,
    credentialId: string,
    commanderApp: CommanderApp,
    region: string
): Promise<IConnectorView> {
    const parameters: IDatacenterLocalQueryRegionSizes = {
        region,
    };
    const sizes: IRegionSizeDatacenterLocal[] = await commanderApp.frontendClient.queryCredential(
        projectId,
        credentialId,
        {
            type: EDatacenterLocalQueryCredential.RegionSizes,
            parameters,
        }
    );
    const connectorConfig: IConnectorDatacenterLocalConfig = {
        region,
        size: sizes[ 0 ].id,
        imageId: void 0,
    };
    const connector = await commanderApp.frontendClient.createConnector(
        projectId,
        {
            name: `myconnector ${region}`,
            proxiesMax: 1,
            credentialId,
            config: connectorConfig,
            certificateDurationInMs: 10 * ONE_MINUTE_IN_MS,
        }
    );

    await commanderApp.frontendClient.installConnector(
        projectId,
        connector.id,
        {
            config: {},
        }
    );

    await waitFor(async() => {
        const connectorFound = await commanderApp.frontendClient.getConnectorById(
            projectId,
            connector.id
        );
        const connectorConfigFound = connectorFound.config as IConnectorDatacenterLocalConfig;
        expect(connectorConfigFound.imageId?.length)
            .toBeGreaterThan(0);
    });

    await commanderApp.frontendClient.activateConnector(
        projectId,
        connector.id,
        true
    );

    return connector;
}


describe(
    'Commander - Proxies - Fingerprint',
    () => {
        const logger = new Logger();
        const
            datacenterLocalApp = new DatacenterLocalApp(logger),
            servers = new TestServers(),
            subscriptionId = uuid();

        beforeAll(async() => {
            // Start target & local connector
            await Promise.all([
                servers.listen(), datacenterLocalApp.start(),
            ]);

            await datacenterLocalApp.client.createSubscription({
                id: subscriptionId,
                ...SUBSCRIPTION_LOCAL_DEFAULTS,
            });
        });

        afterAll(async() => {
            await Promise.all([
                datacenterLocalApp.close(), servers.close(),
            ]);
        });

        describe(
            'Multiple regions',
            () => {
                let
                    commanderApp: CommanderApp,
                    connectors: IConnectorView[],
                    credential: ICredentialView,
                    masterApp: MasterApp,
                    project: IProjectData,
                    regions: IRegionDatacenterLocal[],
                    token: string;

                beforeAll(async() => {
                    // Start app
                    commanderApp = CommanderApp.defaults({
                        datacenterLocalAppUrl: datacenterLocalApp.url,
                        fingerprintUrl: servers.urlFingerprint,
                        logger,
                    });
                    await commanderApp.start();

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


                    await waitFor(async() => {
                        token = await commanderApp.frontendClient.getProjectTokenById(project.id);
                        expect(token.length)
                            .toBeGreaterThan(0);
                    });

                    // Create credential
                    const credentialConfigConfig: IConnectorDatacenterLocalCredential = {
                        subscriptionId,
                    };
                    credential = await commanderApp.frontendClient.createCredential(
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
                    });

                    regions = await commanderApp.frontendClient.queryCredential(
                        project.id,
                        credential.id,
                        {
                            type: EDatacenterLocalQueryCredential.Regions,
                        }
                    );
                });

                afterAll(async() => {
                    // Stop app
                    await commanderApp.stop();

                    await masterApp.stop();
                });

                it(
                    'should install and start connectors in multiple regions',
                    async() => {
                        // Create, install and activate connector
                        connectors = await Promise.all(regions.map((region) => installConnector(
                            project.id,
                            credential.id,
                            commanderApp,
                            region.id
                        )));

                        await waitFor(async() => {
                            const proxiesMax = connectors.reduce(
                                (
                                    acc, connector
                                ) => acc + connector.proxiesMax,
                                0
                            );
                            const views = await commanderApp.frontendClient.getAllProjectConnectorsAndProxiesById(project.id);
                            expect(countProxiesOnlineViews(views))
                                .toBe(proxiesMax);
                        });
                    }
                );

                it(
                    'should have a fingerprint in multiple regions',
                    async() => {
                        // Get fingerprint
                        for (let i = 0; i < regions.length; ++i) {
                            const connector = connectors[ i ],
                                region = regions[ i ];
                            const view = await commanderApp.frontendClient.getAllConnectorProxiesById(
                                project.id,
                                connector.id
                            );
                            for (const proxy of view.proxies) {
                                expect(proxy.fingerprint?.continentName)
                                    .toBe(region.id);
                            }
                        }
                    }
                );

                it(
                    'should have a default fingerprint',
                    async() => {
                        const res = await axios.post<IFingerprint>(
                            servers.urlFingerprint,
                            {},
                            {
                                headers: {
                                    'Proxy-Authorization': `Basic ${token!}`,
                                    'User-Agent': `${SCRAPOXY_USER_AGENT_PREFIX}/${VERSION_TEST} (test; test; test)`,
                                },
                                proxy: {
                                    host: 'localhost',
                                    port: masterApp.masterPort,
                                    protocol: 'http',
                                },
                                validateStatus: () => true,
                            }
                        );

                        expect(res.status)
                            .toBe(200);

                        expect(res.data)
                            .toEqual(DEFAULT_FINGERPRINT);
                    }
                );

                it(
                    'should have no socket anymore',
                    async() => {
                        await waitFor(() => {
                            expect(masterApp.proxiesSocketsSize)
                                .toBe(0);
                        });
                    }
                );
            }
        );

        describe(
            'Timeout',
            () => {
                let
                    commanderApp: CommanderApp,
                    connector: IConnectorView,
                    credential: ICredentialView,
                    masterApp: MasterApp,
                    project: IProjectData,
                    regions: IRegionDatacenterLocal[];

                beforeAll(async() => {
                    // Start app
                    commanderApp = CommanderApp.defaults({
                        datacenterLocalAppUrl: datacenterLocalApp.url,
                        fingerprintUrl: `${servers.urlHttp}/timeout`,
                        fingerprintTimeout: 500,
                        logger,
                    });
                    await commanderApp.start();

                    masterApp = MasterApp.defaults({
                        datacenterLocalAppUrl: datacenterLocalApp.url,
                        commanderApp,
                        fingerprintUrl: `${servers.urlHttp}/timeout`,
                        fingerprintTimeout: 500,
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

                    let token: string;
                    await waitFor(async() => {
                        token = await commanderApp.frontendClient.getProjectTokenById(project.id);
                        expect(token.length)
                            .toBeGreaterThan(0);
                    });

                    // Create credential
                    const credentialConfigConfig: IConnectorDatacenterLocalCredential = {
                        subscriptionId,
                    };
                    credential = await commanderApp.frontendClient.createCredential(
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
                    });

                    regions = await commanderApp.frontendClient.queryCredential(
                        project.id,
                        credential.id,
                        {
                            type: EDatacenterLocalQueryCredential.Regions,
                        }
                    );
                });

                afterAll(async() => {
                    await commanderApp.stop();

                    await masterApp.stop();
                });

                it(
                    'should install and start connectors in multiple regions',
                    async() => {
                        // Create, install and activate connector
                        connector = await installConnector(
                            project.id,
                            credential.id,
                            commanderApp,
                            regions[ 0 ].id
                        );

                        await waitFor(async() => {
                            const view = await commanderApp.frontendClient.getAllConnectorProxiesById(
                                project.id,
                                connector.id
                            );
                            expect(view.proxies)
                                .toHaveLength(connector.proxiesMax);
                        });
                    }
                );

                it(
                    'should get a timeout on proxy fingerprint',
                    async() => {
                        // Get fingerprint
                        await waitFor(async() => {
                            const view = await commanderApp.frontendClient.getAllConnectorProxiesById(
                                project.id,
                                connector.id
                            );
                            for (const proxy of view.proxies) {
                                expect(proxy.fingerprintError)
                                    .toBe('Request timeout');
                            }
                        });
                    }
                );

                it(
                    'should have no socket anymore',
                    async() => {
                        await waitFor(() => {
                            expect(masterApp.proxiesSocketsSize)
                                .toBe(0);
                        });
                    }
                );
            }
        );
    }
);
