import { Logger } from '@nestjs/common';
import {
    DatacenterLocalApp,
    getEnvBackendJwtConfig,
    getEnvFrontendJwtConfig,
} from '@scrapoxy/backend-sdk';
import {
    CommanderApp,
    TestServers,
    waitFor,
} from '@scrapoxy/backend-test-sdk';
import { ONE_MINUTE_IN_MS } from '@scrapoxy/common';
import axios from 'axios';
import * as jwt from 'jsonwebtoken';
import type {
    AxiosRequestConfig,
    AxiosResponse,
    Method,
} from 'axios';


const commandsAuthNone = [
    'GET /users/auths', 'GET /users/me/logout', 'GET /connectors',
];
const commandsAuthFrontend = [
    'GET /users/me',
    'GET /frontend/projects',
    'GET /frontend/projects/00000000-0000-0000-0000-000000000000',
    'GET /frontend/projects/00000000-0000-0000-0000-000000000000/metrics',
    'GET /frontend/projects/00000000-0000-0000-0000-000000000000/token',
    'POST /frontend/projects',
    'PUT /frontend/projects/00000000-0000-0000-0000-000000000000',
    'DELETE /frontend/projects/00000000-0000-0000-0000-000000000000',
    'GET /frontend/projects/00000000-0000-0000-0000-000000000000/users',
    'POST /frontend/projects/00000000-0000-0000-0000-000000000000/users',
    'DELETE /frontend/projects/00000000-0000-0000-0000-000000000000/users/00000000-0000-0000-0000-000000000000',
    'POST /frontend/projects/00000000-0000-0000-0000-000000000000/status',
    'POST /frontend/projects/00000000-0000-0000-0000-000000000000/default',
    'POST /frontend/projects/00000000-0000-0000-0000-000000000000/token',
    'GET /frontend/projects/00000000-0000-0000-0000-000000000000/credentials',
    'GET /frontend/projects/00000000-0000-0000-0000-000000000000/credentials/00000000-0000-0000-0000-000000000000',
    'POST /frontend/projects/00000000-0000-0000-0000-000000000000/credentials',
    'POST /frontend/credentials/callback',
    'PUT /frontend/projects/00000000-0000-0000-0000-000000000000/credentials/00000000-0000-0000-0000-000000000000',
    'DELETE /frontend/projects/00000000-0000-0000-0000-000000000000/credentials/00000000-0000-0000-0000-000000000000',
    'POST /frontend/projects/00000000-0000-0000-0000-000000000000/credentials/00000000-0000-0000-0000-000000000000/query',
    'GET /frontend/projects/00000000-0000-0000-0000-000000000000/connectors',
    'GET /frontend/projects/00000000-0000-0000-0000-000000000000/connectors/00000000-0000-0000-0000-000000000000',
    'GET /frontend/projects/00000000-0000-0000-0000-000000000000/connectors/00000000-0000-0000-0000-000000000000/sync',
    'GET /frontend/projects/00000000-0000-0000-0000-000000000000/connectors/00000000-0000-0000-0000-000000000000/update',
    'POST /frontend/projects/00000000-0000-0000-0000-000000000000/connectors',
    'PUT /frontend/projects/00000000-0000-0000-0000-000000000000/connectors/00000000-0000-0000-0000-000000000000',
    'DELETE /frontend/projects/00000000-0000-0000-0000-000000000000/connectors/00000000-0000-0000-0000-000000000000',
    'POST /frontend/projects/00000000-0000-0000-0000-000000000000/connectors/00000000-0000-0000-0000-000000000000/scale',
    'POST /frontend/projects/00000000-0000-0000-0000-000000000000/connectors/00000000-0000-0000-0000-000000000000/activate',
    'POST /frontend/projects/00000000-0000-0000-0000-000000000000/connectors/00000000-0000-0000-0000-000000000000/install',
    'POST /frontend/projects/00000000-0000-0000-0000-000000000000/connectors/00000000-0000-0000-0000-000000000000/uninstall',
    'POST /frontend/projects/00000000-0000-0000-0000-000000000000/connectors/00000000-0000-0000-0000-000000000000/install/validate',
    'POST /frontend/projects/00000000-0000-0000-0000-000000000000/connectors/00000000-0000-0000-0000-000000000000/certificate',
    'POST /frontend/projects/00000000-0000-0000-0000-000000000000/proxies/remove',
    'GET /frontend/projects/00000000-0000-0000-0000-000000000000/tasks',
    'GET /frontend/projects/00000000-0000-0000-0000-000000000000/tasks/00000000-0000-0000-0000-000000000000',
    'DELETE /frontend/projects/00000000-0000-0000-0000-000000000000/tasks/00000000-0000-0000-0000-000000000000',
    'POST /frontend/projects/00000000-0000-0000-0000-000000000000/tasks/00000000-0000-0000-0000-000000000000/cancel',
    'GET /frontend/projects/00000000-0000-0000-0000-000000000000/connectors/00000000-0000-0000-0000-000000000000/freeproxies/all',
    'POST /frontend/projects/00000000-0000-0000-0000-000000000000/connectors/00000000-0000-0000-0000-000000000000/freeproxies/create',
    'POST /frontend/projects/00000000-0000-0000-0000-000000000000/connectors/00000000-0000-0000-0000-000000000000/freeproxies/remove',
];
const commandsAuthBackend = [
    'POST /master/projects/00000000-0000-0000-0000-000000000000/scaleup',
    'GET /master/projects/00000000-0000-0000-0000-000000000000/proxy',
    'POST /refresh/projects/metrics',
    'POST /refresh/projects/00000000-0000-0000-0000-000000000000/connectors/00000000-0000-0000-0000-000000000000/error',
    'GET /refresh/connectors/refresh',
    'PUT /refresh/projects/00000000-0000-0000-0000-000000000000/connectors/00000000-0000-0000-0000-000000000000/proxies',
    'POST /refresh/projects/00000000-0000-0000-0000-000000000000/connectors/00000000-0000-0000-0000-000000000000/proxies',
    'POST /refresh/proxies/refresh',
    'POST /refresh/proxies/metrics',
    'GET /refresh/proxies/refresh',
    'PUT /refresh/projects/00000000-0000-0000-0000-000000000000/tasks/00000000-0000-0000-0000-000000000000',
    'GET /refresh/tasks/refresh',
    'POST /refresh/projects/00000000-0000-0000-0000-000000000000/connectors/00000000-0000-0000-0000-000000000000/freeproxies/selected',
    'POST /refresh/projects/00000000-0000-0000-0000-000000000000/connectors/00000000-0000-0000-0000-000000000000/freeproxies/new',
    'GET /refresh/freeproxies/refresh',
    'POST /refresh/freeproxies/refresh',
];
const commandsAuthScraper = [
    'GET /scraper/project',
    'POST /scraper/project/status',
    'GET /scraper/project/connectors',
    'POST /scraper/project/proxies/remove',
];


async function requestWithoutAuth(
    request: AxiosRequestConfig, baseURL: string
): Promise<AxiosResponse> {
    request.baseURL = baseURL;

    return axios.request(request);
}


async function requestWithToken(
    request: AxiosRequestConfig, baseURL: string, jwtToken: string
): Promise<AxiosResponse> {
    request.headers = {
        ...request.headers,
        Authorization: `Bearer ${jwtToken}`,
    };

    return requestWithoutAuth(
        request,
        baseURL
    );
}


async function requestWithBasic(
    request: AxiosRequestConfig, baseURL: string, token: string
): Promise<AxiosResponse> {
    request.headers = {
        ...request.headers,
        Authorization: `Basic ${token}`,
    };

    return requestWithoutAuth(
        request,
        baseURL
    );
}


async function requestWithSecret(
    request: AxiosRequestConfig, baseURL: string, secret: string
): Promise<AxiosResponse> {
    const jwtToken = jwt.sign(
        {},
        secret
    );

    return requestWithToken(
        request,
        baseURL,
        jwtToken
    );
}


function accept(
    command: string,
    func: (request: AxiosRequestConfig) => Promise<AxiosResponse>
): Promise<AxiosResponse> {
    const [
        method, url,
    ] = command.split(' ');

    return func({
        method: method as Method,
        url,
        validateStatus: (status: number) => status !== 401,
    });
}


function decline(
    command: string,
    func: (request: AxiosRequestConfig) => Promise<AxiosResponse>
): Promise<AxiosResponse> {
    const [
        method, url,
    ] = command.split(' ');

    return func({
        method: method as Method,
        url,
        validateStatus: (status: number) => status === 401,
    });
}


describe(
    'Commander - Guards',
    () => {
        const logger = new Logger();
        const
            datacenterLocalApp = new DatacenterLocalApp(logger),
            servers = new TestServers();
        let
            commanderApp: CommanderApp,
            projectToken: string;
        const
            jwtBackend = getEnvBackendJwtConfig(),
            jwtFrontend = getEnvFrontendJwtConfig();

        beforeAll(async() => {
            // Start target & local datacenter
            await Promise.all([
                servers.listen(), datacenterLocalApp.start(),
            ]);

            // Start app
            commanderApp = CommanderApp.defaults({
                datacenterLocalAppUrl: datacenterLocalApp.url,
                fingerprintUrl: servers.urlFingerprint,
                logger,
            });
            await commanderApp.start();

            // Create project
            const project = await commanderApp.frontendClient.createProject({
                name: 'myproject',
                autoRotate: true,
                autoRotateDelayRange: {
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

            await waitFor(async() => {
                projectToken = await commanderApp.frontendClient.getProjectTokenById(project.id);
            });
        });

        afterAll(async() => {
            await commanderApp.stop();

            await Promise.all([
                datacenterLocalApp.close(), servers.close(),
            ]);
        });

        it(
            'should have different secrets',
            () => {
                expect(jwtBackend.secret).not.toBe(jwtFrontend.secret);
            }
        );

        function commandWithoutAuth(command: string): () => void {
            return () => {
                it(
                    'should accept without auth',
                    () => accept(
                        command,
                        (request) => requestWithoutAuth(
                            request,
                            commanderApp.url
                        )
                    )
                );

                it(
                    'should accept with auth frontend',
                    () => accept(
                        command,
                        (request) => requestWithToken(
                            request,
                            commanderApp.url,
                            commanderApp.usersClient.jwtToken
                        )
                    )
                );

                it(
                    'should accept with auth backend',
                    () => accept(
                        command,
                        (request) => requestWithSecret(
                            request,
                            commanderApp.url,
                            jwtBackend.secret
                        )
                    )
                );

                it(
                    'should accept with auth scraper',
                    () => accept(
                        command,
                        (request) => requestWithBasic(
                            request,
                            commanderApp.url,
                            projectToken
                        )
                    )
                );
            };
        }

        describe(
            'Commands without auth',
            () => {
                for (const command of commandsAuthNone) {
                    describe(
                        command,
                        commandWithoutAuth(command)
                    );
                }
            }
        );

        function commandWithOnlyAuthFrontend(command: string): () => void {
            return () => {
                it(
                    'should decline without auth',
                    () => decline(
                        command,
                        (request) => requestWithoutAuth(
                            request,
                            commanderApp.url
                        )
                    )
                );

                it(
                    'should accept with auth frontend',
                    () => accept(
                        command,
                        (request) => requestWithToken(
                            request,
                            commanderApp.url,
                            commanderApp.usersClient.jwtToken
                        )
                    )
                );

                it(
                    'should decline with auth backend',
                    () => decline(
                        command,
                        (request) => requestWithSecret(
                            request,
                            commanderApp.url,
                            jwtBackend.secret
                        )
                    )
                );

                it(
                    'should decline with auth scraper',
                    () => decline(
                        command,
                        (request) => requestWithBasic(
                            request,
                            commanderApp.url,
                            projectToken
                        )
                    )
                );
            };
        }

        describe(
            'Commands with only auth frontend',
            () => {
                for (const command of commandsAuthFrontend) {
                    describe(
                        command,
                        commandWithOnlyAuthFrontend(command)
                    );
                }
            }
        );

        function commandWithOnlyAuthBackend(command: string): () => void {
            return () => {
                it(
                    'should decline without auth',
                    () => decline(
                        command,
                        (request) => requestWithoutAuth(
                            request,
                            commanderApp.url
                        )
                    )
                );

                it(
                    'should decline with auth frontend',
                    () => decline(
                        command,
                        (request) => requestWithToken(
                            request,
                            commanderApp.url,
                            commanderApp.usersClient.jwtToken
                        )
                    )
                );

                it(
                    'should accept with auth backend',
                    () => accept(
                        command,
                        (request) => requestWithSecret(
                            request,
                            commanderApp.url,
                            jwtBackend.secret
                        )
                    )
                );

                it(
                    'should decline with auth scraper',
                    () => decline(
                        command,
                        (request) => requestWithBasic(
                            request,
                            commanderApp.url,
                            projectToken
                        )
                    )
                );
            };
        }

        describe(
            'Commands with only auth backend',
            () => {
                for (const command of commandsAuthBackend) {
                    describe(
                        command,
                        commandWithOnlyAuthBackend(command)
                    );
                }
            }
        );

        function commandWithOnlyAuthScraper(command: string): () => void {
            return () => {
                it(
                    'should decline without auth',
                    () => decline(
                        command,
                        (request) => requestWithoutAuth(
                            request,
                            commanderApp.url
                        )
                    )
                );

                it(
                    'should decline with auth frontend',
                    () => decline(
                        command,
                        (request) => requestWithToken(
                            request,
                            commanderApp.url,
                            commanderApp.usersClient.jwtToken
                        )
                    )
                );

                it(
                    'should decline with auth backend',
                    () => decline(
                        command,
                        (request) => requestWithSecret(
                            request,
                            commanderApp.url,
                            jwtBackend.secret
                        )
                    )
                );

                it(
                    'should accept with auth scraper',
                    () => accept(
                        command,
                        (request) => requestWithBasic(
                            request,
                            commanderApp.url,
                            projectToken
                        )
                    )
                );
            };
        }

        describe(
            'Commands with only auth scraper',
            () => {
                for (const command of commandsAuthScraper) {
                    describe(
                        command,
                        commandWithOnlyAuthScraper(command)
                    );
                }
            }
        );
    }
);
