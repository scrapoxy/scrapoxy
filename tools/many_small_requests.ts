import * as fs from 'fs';
import axios, { AxiosError } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import type { AxiosResponse } from 'axios';


interface IAxiosResponseExtended extends AxiosResponse {
    m: string;
    using: string;
}

class AxiosErrorExt extends AxiosError {
    m: string | undefined = void 0;

    using: string | undefined = void 0;
}

const tokensRaw = process.env.TOKENS as string;

if (!tokensRaw) {
    throw new Error('no token specified');
}

const tokens = tokensRaw.split(',');
const proxy = {
    host: process.env.PROXY_HOSTNAME ?? 'localhost',
    port: parseInt(
        process.env.PROXY_PORT ?? '8888',
        10
    ),
    protocol: 'http',
};
const ca = fs.readFileSync('packages/backend/sdk/src/assets/certificates/scrapoxy-ca.crt')
    .toString();
const THREADS_COUNT = 100;


function askFingerprintLoop(
    mode = 0, tokenIndex = 0
): Promise<void> {
    const token = tokens[ tokenIndex ];
    const [
        using, login, password,
    ] = token.split(':');
    const proxyAuthorization = `Basic ${Buffer.from(`${login}:${password}`)
        .toString('base64')}`;
    let requestPromise: Promise<IAxiosResponseExtended>;
    switch (mode) {
        case 0: {
            requestPromise = axios.get(
                'https://fingerprint.scrapoxy.io/api/text',
                {
                    proxy,
                    headers: {
                        'proxy-authorization': proxyAuthorization,
                    },
                    validateStatus: (statusCode) => statusCode === 200,
                }
            )
                .then((res) => {
                    const resExtended = res as IAxiosResponseExtended;
                    resExtended.m = 'http  ';
                    resExtended.using = using;

                    return resExtended;
                })
                .catch((err: AxiosError) => {
                    const errExt = err as AxiosErrorExt;
                    errExt.m = 'http  ';
                    errExt.using = using;

                    throw errExt;
                });

            break;
        }

        case 1: {
            requestPromise = axios.get(
                'https://fingerprint.scrapoxy.io/api/text',
                {
                    proxy,
                    headers: {
                        'proxy-authorization': proxyAuthorization,
                    },
                    validateStatus: (statusCode) => statusCode === 200,
                }
            )
                .then((res) => {
                    const resExtended = res as IAxiosResponseExtended;
                    resExtended.m = 'https ';
                    resExtended.using = using;

                    return resExtended;
                })
                .catch((err: AxiosError) => {
                    const errExt = err as AxiosErrorExt;
                    errExt.m = 'https ';
                    errExt.using = using;

                    throw errExt;
                });

            break;
        }

        case 2: {
            const httpsAgent = new HttpsProxyAgent(`http://${proxy.host}:${proxy.port.toString(10)}`);

            httpsAgent.connectOpts = {
                host: proxy.host,
                port: proxy.port,
                ca,
            };

            httpsAgent.proxyHeaders = {
                'proxy-authorization': proxyAuthorization,
            };

            requestPromise = axios.get(
                'https://fingerprint.scrapoxy.io/api/text',
                {
                    httpsAgent,
                    validateStatus: (statusCode) => statusCode === 200,
                }
            )
                .then((res) => {
                    const resExtended = res as IAxiosResponseExtended;
                    resExtended.m = 'httpsc';
                    resExtended.using = using;

                    return resExtended;
                })
                .catch((err: AxiosError) => {
                    const errExt = err as AxiosErrorExt;
                    errExt.m = 'httpsc';
                    errExt.using = using;

                    throw errExt;
                });

            break;
        }

        default: {
            throw new Error(`unknown mode ${mode}`);
        }
    }

    return requestPromise
        .then((res) => {
            const ip = res.data;
            console.log(`[${res.m}] found ip ${ip} using ${res.using}`);
        })
        .catch((err: any) => {
            console.error(`[${err.m}] get error using ${err.using}: ${err.message}`);
        })
        .finally(() => {
            if (mode >= 2) {
                if (tokenIndex >= tokens.length - 1) {
                    return askFingerprintLoop(
                        0,
                        0
                    );
                }

                return askFingerprintLoop(
                    0,
                    tokenIndex + 1
                );
            }

            return askFingerprintLoop(
                mode + 1,
                tokenIndex
            );
        });
}


(async() => {
    console.log(`use ${THREADS_COUNT} requests in //`);

    const promises: Promise<void>[] = [];
    for (let i = 0; i < THREADS_COUNT; ++i) {
        promises.push(askFingerprintLoop(
            0,
            i % tokens.length
        ));
    }

    await Promise.all(promises);
})()
    .catch((err) => {
        console.error(err);
    });
