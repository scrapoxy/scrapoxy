import { Agent } from 'https';
import axios from 'axios';
import { ProxyReverse } from './proxy-reverse';
import { TestServers } from '../test-servers';


describe(
    'Reverse Proxy',
    () => {
        const
            instance = axios.create({
                validateStatus: () => true,
            }),
            proxyReverse = new ProxyReverse(),
            servers = new TestServers();

        beforeAll(async() => {
            await Promise.all([
                servers.listen(), proxyReverse.listen(),
            ]);
        });

        afterAll(async() => {
            await Promise.all([
                servers.close(), proxyReverse.close(),
            ]);
        });

        beforeEach(() => {
            proxyReverse.clearPort();
        });

        describe(
            'HTTP',
            () => {
                it(
                    'should make a request without proxy',
                    async() => {
                        const res = await instance.get(
                            `${servers.urlHttp}/file/big`,
                            {
                                params: {
                                    size: 1024,
                                },
                            }
                        );

                        expect(res.status)
                            .toBe(200);
                    }
                );

                it(
                    'should make a request with proxy',
                    async() => {
                        proxyReverse.addPort(servers.portHttp);

                        const res = await instance.get(
                            `http://localhost:${proxyReverse.port}/file/big`,
                            {
                                params: {
                                    size: 1024,
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
            'HTTPS',
            () => {
                it(
                    'should make a request without proxy',
                    async() => {
                        const res = await instance.get(
                            `${servers.urlHttps}/file/big`,
                            {
                                params: {
                                    size: 1024,
                                },
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

                it(
                    'should make a request with proxy',
                    async() => {
                        proxyReverse.addPort(servers.portHttps);

                        const res = await instance.get(
                            `https://localhost:${proxyReverse.port}/file/big`,
                            {
                                params: {
                                    size: 1024,
                                },
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

    }
);
