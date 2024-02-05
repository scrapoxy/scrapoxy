import { Logger } from '@nestjs/common';
import {
    IConnectorDatacenterLocalConfig,
    IConnectorDatacenterLocalCredential,
} from '@scrapoxy/backend-connectors';
import {
    DatacenterLocalApp,
    getEnvStorageType,
    RefreshConnectorsModule,
    RefreshTasksModule,
    SUBSCRIPTION_LOCAL_DEFAULTS,
} from '@scrapoxy/backend-sdk';
import {
    CommanderApp,
    MasterApp,
    TestServers,
    VERSION_TEST,
    waitFor,
} from '@scrapoxy/backend-test-sdk';
import {
    CONNECTOR_DATACENTER_LOCAL_TYPE,
    EProxyStatus,
    ONE_MINUTE_IN_MS,
    PROXY_TIMEOUT_DISCONNECTED_DEFAULT_TEST,
    PROXY_TIMEOUT_UNREACHABLE_DEFAULT,
    randomName,
    sleep,
} from '@scrapoxy/common';
import { v4 as uuid } from 'uuid';
import type { IProxyTest } from '@scrapoxy/backend-sdk';
import type {
    ICredentialView,
    IProjectData,
} from '@scrapoxy/common';


interface ITestState {
    local: IProxyTest[];
    remote: IProxyTest[];
}


interface ITest {
    name: string;
    proxiesMax: number;
    init: ITestState;
    final: ITestState;
}


const sarahJohnStarted: IProxyTest[] = [
    {
        key: 'sarah',
        status: EProxyStatus.STARTED,
    },
    {
        key: 'john',
        status: EProxyStatus.STARTED,
    },
];
const tests: ITest[] = [
    {
        name: 'should discover an existing remote connector',
        proxiesMax: 2,
        init: {
            local: [],
            remote: sarahJohnStarted,
        },
        final: {
            local: sarahJohnStarted,
            remote: sarahJohnStarted,
        },
    },
    {
        name: 'should have same local and remote connector',
        proxiesMax: 2,
        init: {
            local: [
                {
                    key: 'sarah',
                    status: EProxyStatus.STARTED,
                },
                {
                    key: 'john',
                    status: EProxyStatus.STARTING,
                },
            ],
            remote: [
                {
                    key: 'sarah',
                    status: EProxyStatus.STARTED,
                },
                {
                    key: 'john',
                    status: EProxyStatus.STARTED,
                },
            ],
        },
        final: {
            local: sarahJohnStarted,
            remote: sarahJohnStarted,
        },
    },
    {
        name: 'should have different local and remote connector',
        proxiesMax: 2,
        init: {
            local: [
                {
                    key: 'herbert',
                    status: EProxyStatus.STOPPING,
                },
                {
                    key: 'cannon',
                    status: EProxyStatus.STARTING,
                },
            ],
            remote: sarahJohnStarted,
        },
        final: {
            local: sarahJohnStarted,
            remote: sarahJohnStarted,
        },
    },
    {
        name: 'should have a local connector and nothing on remote',
        proxiesMax: 0,
        init: {
            local: [
                {
                    key: 'sarah',
                    status: EProxyStatus.STARTED,
                },
                {
                    key: 'john',
                    status: EProxyStatus.STARTING,
                },
            ],
            remote: [],
        },
        final: {
            local: [],
            remote: [],
        },
    },
];


describe(
    'Commander - Connectors - Sync',
    () => {
        const storageType = getEnvStorageType() ?? 'file';

        if (![
            'file', 'memory',
        ].includes(storageType)) {
            it(
                'should ignore all tests if storage is not local (file or memory)',
                () => void 0
            );

            return;
        }

        const logger = new Logger();
        const
            datacenterLocalApp = new DatacenterLocalApp(logger),
            servers = new TestServers(),
            subscriptionId = uuid();
        let
            commanderApp: CommanderApp,
            credential: ICredentialView,
            masterApp: MasterApp,
            project: IProjectData;

        beforeEach(async() => {
            // Start target & local connector
            await Promise.all([
                servers.listen(), datacenterLocalApp.start(),
            ]);

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

            masterApp = new MasterApp({
                datacenterLocalAppUrl: datacenterLocalApp.url,
                commanderApp,
                fingerprintUrl: servers.urlFingerprint,
                imports: [
                    RefreshConnectorsModule.forRoot(
                        commanderApp.url,
                        VERSION_TEST
                    ),
                    RefreshTasksModule.forRoot(
                        commanderApp.url,
                        VERSION_TEST
                    ),
                ],
                logger,
            });
            await masterApp.start();

            // Create a project
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
        });

        afterEach(async() => {
            await commanderApp.stop();

            await Promise.all([
                masterApp.stop(), datacenterLocalApp.close(), servers.close(),
            ]);
        });

        async function makeTest(test: ITest): Promise<void> {
            // Create connector
            const connectorConfig: IConnectorDatacenterLocalConfig = {
                region: 'europe',
                size: 'small',
                imageId: void 0,
            };
            const connector = await commanderApp.frontendClient.createConnector(
                project.id,
                {
                    name: randomName(),
                    credentialId: credential.id,
                    proxiesMax: test.proxiesMax,
                    proxiesTimeoutDisconnected: PROXY_TIMEOUT_DISCONNECTED_DEFAULT_TEST,
                    proxiesTimeoutUnreachable: {
                        enabled: true,
                        value: PROXY_TIMEOUT_UNREACHABLE_DEFAULT,
                    },
                    config: connectorConfig,
                    certificateDurationInMs: 10 * ONE_MINUTE_IN_MS,
                }
            );

            // Install connector
            await commanderApp.frontendClient.installConnector(
                project.id,
                connector.id,
                {
                    config: {},
                }
            );

            let imageId: string | undefined = void 0;
            await waitFor(async() => {
                const connectorFound = await commanderApp.frontendClient.getConnectorById(
                    project.id,
                    connector.id
                );
                const connectorConfigFound = connectorFound.config as IConnectorDatacenterLocalConfig;
                expect(connectorConfigFound.imageId?.length)
                    .toBeGreaterThan(0);

                imageId = connectorConfigFound.imageId;
            });

            // Add initial data to storage
            commanderApp.initFakesProxies(
                project.id,
                connector.id,
                test.init.local
            );

            // Add initial data to remote connector (local)
            await datacenterLocalApp.initFakeProxies(
                subscriptionId,
                'europe',
                'small',
                imageId!,
                test.init.remote
            );

            // Activate connector
            await commanderApp.frontendClient.activateConnector(
                project.id,
                connector.id,
                true
            );

            // Wait for connector to process data
            await sleep(1000);

            // Check consistency
            const { proxies: localProxies } = await commanderApp.frontendClient.getAllConnectorProxiesById(
                project.id,
                connector.id
            );
            const localFakeProxies = localProxies.map((p) => {
                const proxy: IProxyTest = {
                    key: p.key,
                    status: p.status,
                };

                return proxy;
            });
            expect(localFakeProxies)
                .toEqual(test.final.local);

            const remoteFakeProxies = datacenterLocalApp.getFakeProxies(
                subscriptionId,
                'europe'
            );
            expect(remoteFakeProxies)
                .toEqual(test.final.remote);
        }

        for (const test of tests) {
            it(
                test.name,
                async() => {
                    await makeTest(test);
                }
            );
        }
    }
);
