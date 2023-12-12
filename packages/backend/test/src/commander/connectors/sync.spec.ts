import { Logger } from '@nestjs/common';
import {
    getEnvStorageType,
    RefreshConnectorsModule,
    RefreshTasksModule,
} from '@scrapoxy/backend-sdk';
import {
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
    EProxyStatus,
    ONE_MINUTE_IN_MS,
    randomName,
    sleep,
} from '@scrapoxy/common';
import { CONNECTOR_CLOUDLOCAL_TYPE } from '@scrapoxy/connector-cloudlocal-sdk';
import { v4 as uuid } from 'uuid';
import type { IProxyTest } from '@scrapoxy/cloudlocal';
import type {
    ICredentialView,
    IProjectData,
} from '@scrapoxy/common';
import type {
    IConnectorCloudlocalConfig,
    IConnectorCloudlocalCredential,
} from '@scrapoxy/connector-cloudlocal-backend';


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
            cloudlocalApp = new CloudlocalApp(logger),
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

            masterApp = new MasterApp({
                cloudlocalAppUrl: cloudlocalApp.url,
                commanderApp,
                fingerprintUrl: servers.urlFingerprint,
                imports: [
                    RefreshConnectorsModule.forRoot(commanderApp.url), RefreshTasksModule.forRoot(commanderApp.url),
                ],
                logger,
            });
            await masterApp.start();

            // Create a project
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
            credential = await commanderApp.frontendClient.createCredential(
                project.id,
                {
                    name: 'mycredential',
                    type: CONNECTOR_CLOUDLOCAL_TYPE,
                    config: credentialConfig,
                }
            );
        });

        afterEach(async() => {
            await commanderApp.stop();

            await Promise.all([
                masterApp.stop(), cloudlocalApp.close(), servers.close(),
            ]);
        });

        async function makeTest(test: ITest): Promise<void> {
            // Create connector
            const connectorConfig: IConnectorCloudlocalConfig = {
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
                const connectorConfigFound = connectorFound.config as IConnectorCloudlocalConfig;
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
            await cloudlocalApp.initFakeProxies(
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

            const remoteFakeProxies = cloudlocalApp.getFakeProxies(
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
