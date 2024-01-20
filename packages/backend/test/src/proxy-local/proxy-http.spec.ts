import { Agent } from 'https';
import { Logger } from '@nestjs/common';
import { ProxyHttp } from '@scrapoxy/backend-sdk';
import {
    AgentProxyHttpsTunnel,
    TestServers,
} from '@scrapoxy/backend-test-sdk';
import {
    ONE_MINUTE_IN_MS,
    sleep,
} from '@scrapoxy/common';
import axios from 'axios';


describe(
    'Proxy - HTTP',
    () => {
        const
            instance = axios.create({
                validateStatus: () => true,
            }),
            payload = {
                foo: 'bar',
            },
            proxyServer = new ProxyHttp(
                new Logger(),
                ONE_MINUTE_IN_MS
            ),
            servers = new TestServers();

        beforeAll(async() => {
            // Start target and proxy
            await Promise.all([
                servers.listen(), proxyServer.listen(),
            ]);
        });

        afterAll(async() => {
            await Promise.all([
                proxyServer.close(), servers.close(),
            ]);
        });

        describe(
            'Direct connection',
            () => {
                it(
                    'should have a direct HTTP connection',
                    async() => {
                        const res = await instance.get(`${servers.urlHttp}/mirror/headers`);

                        expect(res.status)
                            .toBe(200);
                    }
                );

                it(
                    'should have a direct HTTPS connection',
                    async() => {
                        const res = await instance.get(
                            `${servers.urlHttps}/mirror/headers`,
                            {
                                httpsAgent: new Agent({
                                    requestCert: true,
                                    rejectUnauthorized: false,
                                }),
                            }
                        );

                        expect(res.status)
                            .toBe(200);
                    }
                );
            }
        );

        describe(
            'HTTP over HTTP requests',
            () => {
                it(
                    'should have a socket hang up if remote socket is destroyed',
                    async() => {
                        const res = await instance.get(
                            `${servers.urlHttp}/socketdestroy`,
                            {
                                proxy: {
                                    host: 'localhost',
                                    port: proxyServer.port as number,
                                    protocol: 'http',
                                },
                            }
                        );

                        expect(res.status)
                            .toBe(500);
                        expect(res.data)
                            .toContain('socket hang up');
                    }
                );

                it(
                    'should have a socket hang up if using wrong protocol',
                    async() => {
                        const res = await instance.get(
                            `http://localhost:${servers.portHttps}/mirror/headers`,
                            {
                                proxy: {
                                    host: 'localhost',
                                    port: proxyServer.port as number,
                                    protocol: 'http',
                                },
                            }
                        );

                        expect(res.status)
                            .toBe(500);
                        expect(res.data)
                            .toContain('socket hang up');
                    }
                );

                it(
                    'should handle timeout',
                    async() => {
                        try {
                            await expect(instance.get(
                                `${servers.urlHttp}/mirror/headers`,
                                {
                                    proxy: {
                                        host: 'localhost',
                                        port: proxyServer.port as number,
                                        protocol: 'http',
                                    },
                                    timeout: 1,
                                }
                            )).rejects.toThrow('timeout');
                        } finally {
                            // Lets the server close the socket
                            await sleep(500);
                        }
                    }
                );

                it(
                    'should refuse connection if connects on a closed port',
                    async() => {
                        const res = await instance.get(
                            `http://localhost:${servers.portHttp - 100}/mirror/headers`,
                            {
                                proxy: {
                                    host: 'localhost',
                                    port: proxyServer.port as number,
                                    protocol: 'http',
                                },
                            }
                        );

                        expect(res.status)
                            .toBe(500);
                        expect(res.data)
                            .toContain('ECONNREFUSED');
                    }
                );

                it(
                    'should request GET',
                    async() => {
                        const res = await instance.get(
                            `${servers.urlHttp}/mirror/headers`,
                            {
                                proxy: {
                                    host: 'localhost',
                                    port: proxyServer.port as number,
                                    protocol: 'http',
                                },
                            }
                        );

                        expect(res.status)
                            .toBe(200);
                    }
                );

                it(
                    'should request POST',
                    async() => {
                        const res = await instance.post(
                            `${servers.urlHttp}/mirror/payload`,
                            payload,
                            {
                                proxy: {
                                    host: 'localhost',
                                    port: proxyServer.port as number,
                                    protocol: 'http',
                                },
                            }
                        );


                        expect(res.status)
                            .toBe(200);
                        expect(res.data)
                            .toEqual(payload);
                    }
                );
            }
        );

        describe(
            'HTTPS over HTTP requests',
            () => {
                it(
                    'should have a socket hang up if remote socket is destroyed',
                    async() => {
                        const res = await instance.get(
                            `${servers.urlHttps}/socketdestroy`,
                            {
                                proxy: {
                                    host: 'localhost',
                                    port: proxyServer.port as number,
                                    protocol: 'http',
                                },
                            }
                        );

                        expect(res.data)
                            .toBe('socket hang up');

                        expect(res.status)
                            .toBe(500);
                    }
                );

                it(
                    'should have a wrong version number if using wrong protocol',
                    async() => {
                        const res = await instance.get(
                            `https://localhost:${servers.portHttp}/mirror/headers`,
                            {
                                proxy: {
                                    host: 'localhost',
                                    port: proxyServer.port as number,
                                    protocol: 'http',
                                },
                            }
                        );

                        expect(res.status)
                            .toBe(500);
                        expect(res.data)
                            .toContain('wrong version number');
                    }
                );

                it(
                    'should handle timeout',
                    async() => {
                        try {
                            await expect(instance.get(
                                `${servers.urlHttps}/mirror/headers`,
                                {
                                    proxy: {
                                        host: 'localhost',
                                        port: proxyServer.port as number,
                                        protocol: 'http',
                                    },
                                    timeout: 1,
                                }
                            )).rejects.toThrow('timeout');
                        } finally {
                            // Lets the server close the socket
                            await sleep(500);
                        }
                    }
                );

                it(
                    'should refuse connection if connects on a closed port',
                    async() => {
                        const res = await instance.get(
                            `https://localhost:${servers.portHttps - 100}/mirror/headers`,
                            {
                                proxy: {
                                    host: 'localhost',
                                    port: proxyServer.port as number,
                                    protocol: 'http',
                                },
                            }
                        );

                        expect(res.status)
                            .toBe(500);
                        expect(res.data)
                            .toContain('ECONNREFUSED');
                    }
                );

                it(
                    'should request GET',
                    async() => {
                        const res = await instance.get(
                            `${servers.urlHttps}/mirror/headers`,
                            {
                                proxy: {
                                    host: 'localhost',
                                    port: proxyServer.port as number,
                                    protocol: 'http',
                                },
                            }
                        );

                        expect(res.status)
                            .toBe(200);
                    }
                );

                it(
                    'should request POST',
                    async() => {
                        const res = await instance.post(
                            `${servers.urlHttps}/mirror/payload`,
                            payload,
                            {
                                proxy: {
                                    host: 'localhost',
                                    port: proxyServer.port as number,
                                    protocol: 'http',
                                },
                            }
                        );

                        expect(res.status)
                            .toBe(200);
                        expect(res.data)
                            .toEqual(payload);
                    }
                );
            }
        );

        describe(
            'HTTPS over HTTP tunnel requests',
            () => {
                it(
                    'should have a socket hang up if remote socket is destroyed',
                    async() => {
                        const httpsAgent = new AgentProxyHttpsTunnel({
                            hostname: 'localhost',
                            port: proxyServer.port as number,
                        });

                        try {
                            await expect(instance.get(
                                `${servers.urlHttps}/socketdestroy`,
                                {
                                    httpsAgent,
                                }
                            )).rejects.toThrow('socket hang up');
                        } finally {
                            httpsAgent.close();
                        }
                    }
                );

                it(
                    'should have a wrong version number error if using HTTPS on HTTP port',
                    async() => {
                        const httpsAgent = new AgentProxyHttpsTunnel({
                            hostname: 'localhost',
                            port: proxyServer.port as number,
                        });

                        try {
                            await expect(instance.get(
                                `https://localhost:${servers.portHttp}/mirror/headers`,
                                {
                                    httpsAgent,
                                }
                            )).rejects.toThrowError('wrong version number');
                        } finally {
                            httpsAgent.close();
                        }
                    }
                );

                it(
                    'should handle timeout',
                    async() => {
                        const httpsAgent = new AgentProxyHttpsTunnel({
                            hostname: 'localhost',
                            port: proxyServer.port as number,
                        });

                        try {
                            await expect(instance.get(
                                `${servers.urlHttps}/mirror/headers`,
                                {
                                    httpsAgent,
                                    timeout: 1,
                                }
                            )).rejects.toThrow('timeout');
                        } finally {
                            httpsAgent.close();

                            // Lets the server close the socket
                            await sleep(500);
                        }
                    }
                );

                it(
                    'should refuse connection if connects on a closed port',
                    async() => {
                        const httpsAgent = new AgentProxyHttpsTunnel({
                            hostname: 'localhost',
                            port: proxyServer.port as number,
                        });

                        try {
                            await expect(instance.get(
                                `https://localhost:${servers.portHttps - 100}/mirror/headers`,
                                {
                                    httpsAgent,
                                }
                            )).rejects.toThrowError('ECONNREFUSED');
                        } finally {
                            httpsAgent.close();
                        }
                    }
                );

                it(
                    'should request GET',
                    async() => {
                        const httpsAgent = new AgentProxyHttpsTunnel({
                            hostname: 'localhost',
                            port: proxyServer.port as number,
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

                it(
                    'should request POST',
                    async() => {
                        const httpsAgent = new AgentProxyHttpsTunnel({
                            hostname: 'localhost',
                            port: proxyServer.port as number,
                        });

                        try {
                            const res = await instance.post(
                                `${servers.urlHttps}/mirror/payload`,
                                payload,
                                {
                                    httpsAgent,
                                }
                            );

                            expect(res.status)
                                .toBe(200);
                            expect(res.data)
                                .toEqual(payload);
                        } finally {
                            httpsAgent.close();
                        }
                    }
                );
            }
        );
    }
);
