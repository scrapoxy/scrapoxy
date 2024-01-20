import { Logger } from '@nestjs/common';
import {
    AgentProxyHttpsTunnel,
    TestServers,
} from '@scrapoxy/backend-test-sdk';
import { ONE_MINUTE_IN_MS } from '@scrapoxy/common';
import { ProxyLocalApp } from '@scrapoxy/proxy-local';
import axios from 'axios';
import { v4 as uuid } from 'uuid';


describe(
    'Proxy Local - Sessions',
    () => {
        const token = btoa(uuid());
        const
            instance = axios.create({
                validateStatus: () => true,
            }),
            proxyLocalApp = new ProxyLocalApp(
                new Logger(),
                ONE_MINUTE_IN_MS,
                token
            ),
            servers = new TestServers(),
            sessions: string[] = [];

        beforeAll(async() => {
            await Promise.all([
                servers.listen(), proxyLocalApp.listen(),
            ]);
        });

        afterAll(async() => {
            await Promise.all([
                proxyLocalApp.close(), servers.close(),
            ]);
        });

        describe(
            'Authentication',
            () => {
                it(
                    'should not connect to API without token',
                    async() => {
                        const res = await instance.get<string[]>(`http://localhost:${proxyLocalApp.port}/api/sessions`);

                        expect(res.status)
                            .toBe(401);
                    }
                );

                it(
                    'should not make a request without token',
                    async() => {
                        const res = await instance.get(
                            `${servers.urlHttp}/mirror/headers`,
                            {
                                proxy: {
                                    host: 'localhost',
                                    port: proxyLocalApp.port as number,
                                    protocol: 'http',
                                },
                            }
                        );

                        expect(res.status)
                            .toBe(401);
                    }
                );

                it(
                    'should not make a tunnel request without token',
                    async() => {
                        const httpsAgent = new AgentProxyHttpsTunnel({
                            hostname: 'localhost',
                            port: proxyLocalApp.port as number,
                        });

                        try {
                            await expect(instance.get(
                                `${servers.urlHttps}/mirror/headers`,
                                {
                                    httpsAgent,
                                }
                            )).rejects.toThrowError('Unauthorized');
                        } finally {
                            httpsAgent.close();
                        }
                    }
                );
            }
        );

        describe(
            'Sessions creation',
            () => {
                it(
                    'should have no session',
                    async() => {
                        const res = await instance.get<string[]>(
                            `http://localhost:${proxyLocalApp.port}/api/sessions`,
                            {
                                headers: {
                                    Authorization: `Basic ${token}`,
                                },
                            }
                        );

                        expect(res.status)
                            .toBe(200);

                        expect(res.data)
                            .toHaveLength(0);
                    }
                );

                it(
                    'should create 2 sessions',
                    async() => {
                        for (let i = 0; i < 2; ++i) {
                            const res = await instance.post<string>(
                                `http://localhost:${proxyLocalApp.port}/api/sessions`,
                                {},
                                {
                                    headers: {
                                        Authorization: `Basic ${token}`,
                                    },
                                    responseType: 'text',
                                }
                            );

                            expect(res.status)
                                .toBe(200);

                            const session = res.data;
                            expect(session.length)
                                .toBeGreaterThan(0);
                            sessions.push(session);
                        }
                    }
                );

                it(
                    'should have 2 sessions',
                    async() => {
                        const res = await instance.get<string[]>(
                            `http://localhost:${proxyLocalApp.port}/api/sessions`,
                            {
                                headers: {
                                    Authorization: `Basic ${token}`,
                                },
                            }
                        );

                        expect(res.status)
                            .toBe(200);
                        expect(res.data)
                            .toHaveLength(2);
                    }
                );
            }
        );

        describe(
            'HTTP over HTTP requests',
            () => {
                it(
                    'should not make a request without session',
                    async() => {
                        const res = await instance.get(
                            `${servers.urlHttp}/mirror/headers`,
                            {
                                proxy: {
                                    host: 'localhost',
                                    port: proxyLocalApp.port as number,
                                    protocol: 'http',
                                },
                                headers: {
                                    'Proxy-Authorization': `Basic ${token}`,
                                },
                            }
                        );

                        expect(res.status)
                            .toBe(400);
                        expect(res.data)
                            .toBe('No session header found');
                    }
                );

                it(
                    'should not make a request with an unknown session',
                    async() => {
                        const res = await instance.get(
                            `${servers.urlHttp}/mirror/headers`,
                            {
                                proxy: {
                                    host: 'localhost',
                                    port: proxyLocalApp.port as number,
                                    protocol: 'http',
                                },
                                headers: {
                                    'Proxy-Authorization': `Basic ${token}`,
                                    'X-Proxy-local-Session-ID': 'unknown',
                                },
                            }
                        );

                        expect(res.status)
                            .toBe(400);
                        expect(res.data)
                            .toBe('Session unknown not found');
                    }
                );

                it(
                    'should make a request',
                    async() => {
                        const res = await instance.get(
                            `${servers.urlHttp}/mirror/headers`,
                            {
                                proxy: {
                                    host: 'localhost',
                                    port: proxyLocalApp.port as number,
                                    protocol: 'http',
                                },
                                headers: {
                                    'Proxy-Authorization': `Basic ${token}`,
                                    'X-Proxy-local-Session-ID': sessions[ 0 ],
                                },
                            }
                        );

                        expect(res.status)
                            .toBe(200);
                    }
                );
            }
        );

        describe(
            'HTTPS over HTTP requests',
            () => {
                it(
                    'should not make a request without session',
                    async() => {
                        const res = await instance.get(
                            `${servers.urlHttps}/mirror/headers`,
                            {
                                proxy: {
                                    host: 'localhost',
                                    port: proxyLocalApp.port as number,
                                    protocol: 'http',
                                },
                                headers: {
                                    'Proxy-Authorization': `Basic ${token}`,
                                },
                            }
                        );

                        expect(res.status)
                            .toBe(400);
                        expect(res.data)
                            .toBe('No session header found');
                    }
                );

                it(
                    'should not make a request with an unknown session',
                    async() => {
                        const res = await instance.get(
                            `${servers.urlHttps}/mirror/headers`,
                            {
                                proxy: {
                                    host: 'localhost',
                                    port: proxyLocalApp.port as number,
                                    protocol: 'http',
                                },
                                headers: {
                                    'Proxy-Authorization': `Basic ${token}`,
                                    'X-Proxy-local-Session-ID': 'unknown',
                                },
                            }
                        );

                        expect(res.status)
                            .toBe(400);
                        expect(res.data)
                            .toBe('Session unknown not found');
                    }
                );

                it(
                    'should make a request',
                    async() => {
                        const res = await instance.get(
                            `${servers.urlHttps}/mirror/headers`,
                            {
                                proxy: {
                                    host: 'localhost',
                                    port: proxyLocalApp.port as number,
                                    protocol: 'http',
                                },
                                headers: {
                                    'Proxy-Authorization': `Basic ${token}`,
                                    'X-Proxy-local-Session-ID': sessions[ 1 ],
                                },
                            }
                        );

                        expect(res.status)
                            .toBe(200);
                    }
                );
            }
        );

        describe(
            'HTTPS over HTTP tunnel requests',
            () => {
                it(
                    'should not make a request without session',
                    async() => {
                        const httpsAgent = new AgentProxyHttpsTunnel({
                            hostname: 'localhost',
                            port: proxyLocalApp.port as number,
                            headers: {
                                'Proxy-Authorization': `Basic ${token}`,
                            },
                        });

                        try {
                            await expect(instance.get(
                                `${servers.urlHttps}/mirror/headers`,
                                {
                                    httpsAgent,
                                }
                            )).rejects.toThrowError('No session header found');
                        } finally {
                            httpsAgent.close();
                        }
                    }
                );

                it(
                    'should not make a request with an unknown session',
                    async() => {
                        const httpsAgent = new AgentProxyHttpsTunnel({
                            hostname: 'localhost',
                            port: proxyLocalApp.port as number,
                            headers: {
                                'Proxy-Authorization': `Basic ${token}`,
                                'X-Proxy-local-Session-ID': 'unknown',
                            },
                        });

                        try {
                            await expect(instance.get(
                                `${servers.urlHttps}/mirror/headers`,
                                {
                                    httpsAgent,
                                }
                            )).rejects.toThrowError('Session unknown not found');
                        } finally {
                            httpsAgent.close();
                        }
                    }
                );

                it(
                    'should make a request',
                    async() => {
                        const httpsAgent = new AgentProxyHttpsTunnel({
                            hostname: 'localhost',
                            port: proxyLocalApp.port as number,
                            headers: {
                                'Proxy-Authorization': `Basic ${token}`,
                                'X-Proxy-local-Session-ID': sessions[ 0 ],
                            },
                        });

                        try {
                            const res = await instance.get(
                                `${servers.urlHttps}/mirror/headers`,
                                {
                                    httpsAgent,
                                }
                            );

                            expect(res.status)
                                .toBe(200);
                        } finally {
                            httpsAgent.close();
                        }
                    }
                );
            }
        );

        describe(
            'Sessions cleanup',
            () => {
                it(
                    'should remove 2 sessions',
                    async() => {
                        expect(sessions)
                            .toHaveLength(2);

                        for (const session of sessions) {
                            const res = await instance.delete(
                                `http://localhost:${proxyLocalApp.port}/api/sessions/${session}`,
                                {
                                    headers: {
                                        Authorization: `Basic ${token}`,
                                    },
                                }
                            );

                            expect(res.status)
                                .toBe(204);
                        }
                    }
                );

                it(
                    'should have no session',
                    async() => {
                        const res = await instance.get<string[]>(
                            `http://localhost:${proxyLocalApp.port}/api/sessions`,
                            {
                                headers: {
                                    Authorization: `Basic ${token}`,
                                },
                            }
                        );

                        expect(res.status)
                            .toBe(200);
                        expect(res.data)
                            .toHaveLength(0);
                    }
                );
            }
        );
    }
);
