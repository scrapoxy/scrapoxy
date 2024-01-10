import { exec } from 'child_process';
import { join } from 'path';
import { Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
    CommanderMasterClientService,
    generateCertificateFromCaTest,
    generateCertificateSelfSignedForTest,
    MasterModule,
    MasterService,
} from '@scrapoxy/backend-sdk';
import {
    TestServers,
    USERAGENT_TEST,
} from '@scrapoxy/backend-test-sdk';
import {
    EConnectMode,
    EProjectStatus,
    formatProxyId,
    generateUseragent,
    ONE_MINUTE_IN_MS,
    ONE_SECOND_IN_MS,
    randomName,
} from '@scrapoxy/common';
import { ConnectorCloudlocalModule } from '@scrapoxy/connector-cloudlocal-backend';
import { CONNECTOR_CLOUDLOCAL_TYPE } from '@scrapoxy/connector-cloudlocal-sdk';
import { Proxy } from '@scrapoxy/proxy-sdk';
import { v4 as uuid } from 'uuid';
import type { INestApplication } from '@nestjs/common';
import type { IProxyToConnectConfigCloud } from '@scrapoxy/backend-sdk';
import type {
    ICertificate,
    IProjectToConnect,
    IProxyToConnect,
} from '@scrapoxy/common';


function execCommand(
    cmd: string, env = {}
): Promise<void> {
    return new Promise<void>((
        resolve, reject
    ) => {
        const item = exec(
            cmd,
            {
                env,
            },
            (err: any) => {
                if (err) {
                    reject(err);
                }
            }
        );

        item.on(
            'exit',
            (code) => {
                if (code && code > 0) {
                    reject(new Error(`code is ${code}`));
                }

                resolve();
            }
        );
    });
}

function execScript(
    runtime: string, options: string[], script: string, masterPort: number, servers: TestServers
): Promise<void> {
    const scriptPath = join(
        'packages',
        'backend',
        'test',
        'src',
        'assets',
        'languages',
        script
    );

    return execCommand(
        `"${runtime}" ${options.join(' ')} "${scriptPath}"`,
        {
            MASTER_PORT: masterPort.toString(10),
            SERVERS_PORT_HTTP: servers.portHttp.toString(10),
            SERVERS_PORT_HTTPS: servers.portHttps.toString(10),
        }
    );
}

describe(
    'Master - Languages',
    () => {
        const certificateProxy = generateCertificateSelfSignedForTest();
        const
            connectorId = uuid(),
            key = randomName(),
            proxyServer: Proxy = new Proxy(
                new Logger('Proxy'),
                ONE_MINUTE_IN_MS,
                certificateProxy.cert,
                certificateProxy.key
            ),
            servers = new TestServers();
        let
            app: INestApplication,
            certificateMitm: ICertificate,
            master: MasterService,
            port: number,
            proxy: IProxyToConnect;

        beforeAll(async() => {
            // Get certificates
            certificateMitm = await generateCertificateFromCaTest();

            // Start target and proxy
            await Promise.all([
                servers.listen(), proxyServer.listen(),
            ]);

            const config: IProxyToConnectConfigCloud = {
                address: {
                    hostname: 'localhost',
                    port: proxyServer.port as number,
                },
                certificate: certificateProxy,
            };
            proxy = {
                id: formatProxyId(
                    connectorId,
                    key
                ),
                type: CONNECTOR_CLOUDLOCAL_TYPE,
                connectorId: connectorId,
                projectId: uuid(),
                key,
                config,
                useragent: generateUseragent(),
            };

            // Start master
            const fakeConfig = {
                url: 'http://unused_url',
                useragent: USERAGENT_TEST,
                jwt: {
                    secret: 'unused_secret',
                    expiration: '60s',
                },
                delay: 10 * ONE_SECOND_IN_MS,
            };
            const moduleRef = await Test.createTestingModule({
                imports: [
                    ConnectorCloudlocalModule.forRoot({
                        url: fakeConfig.url,
                    }),
                    MasterModule.forRoot({
                        port: 0,
                        timeout: ONE_MINUTE_IN_MS,
                        master: fakeConfig,
                        refreshMetrics: fakeConfig,
                        trackSockets: true,
                    }),
                ],
            })
                .overrideProvider(CommanderMasterClientService)
                .useValue({
                    getProjectToConnect: async(
                        token: string, mode: EConnectMode
                    ): Promise<IProjectToConnect> => ({
                        id: proxy.projectId,
                        autoScaleUp: true,
                        certificate: mode !== EConnectMode.TUNNEL ? certificateMitm : null,
                        cookieSession: true,
                        status: EProjectStatus.HOT,
                        useragentOverride: false,
                    }),
                    getNextProxyToConnect: async(): Promise<IProxyToConnect> => proxy,
                })
                .compile();

            app = moduleRef.createNestApplication();

            await app.listen(0);
            master = app.get<MasterService>(MasterService);
            port = master.port as number;
        });


        afterAll(async() => {
            await Promise.all([
                app.close(), proxyServer.close(), servers.close(),
            ]);
        });

        it(
            'should execute requests with Curl',
            async() => {
                // HTTP over HTTP
                await execCommand(`curl --fail --proxy http://fake:token@localhost:${port} ${servers.urlHttp}/file/big?size=1024`);

                // HTTPS over HTTP
                await execCommand(`curl --fail --insecure --proxy http://fake:token@localhost:${port} ${servers.urlHttps}/file/big?size=1024`);
            }
        );

        it(
            'should execute requests in Python',
            async() => {
                await execScript(
                    // eslint-disable-next-line @typescript-eslint/no-implied-eval
                    process.env.PYTHON as string,
                    [],
                    'test.py',
                    port,
                    servers
                );
            }
        );

        it(
            'should execute requests in Java',
            async() => {
                await execScript(
                    // eslint-disable-next-line @typescript-eslint/no-implied-eval
                    process.env.JAVA as string,
                    [
                        '-Djdk.http.auth.tunneling.disabledSchemes=""',
                    ],
                    'test.java',
                    port,
                    servers
                );
            }
        );
    }
);
