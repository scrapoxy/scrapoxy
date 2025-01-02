import { promises as fs } from 'fs';
import { join } from 'path';
import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import type {
    AxiosBasicCredentials,
    AxiosProxyConfig,
    AxiosResponse,
} from 'axios';


interface IProxyCheck {
    name: string;
    url: string;
    inactive?: boolean;
}


function formatHrTime(hrtime: [ number, number ]): string {
    const seconds = hrtime[ 0 ];
    const milliseconds = Math.floor(hrtime[ 1 ] / 1000000);

    return `${seconds}.${milliseconds}s`;
}


function parseProxy(url: string | undefined): AxiosProxyConfig {
    if (!url || url.length <= 0) {
        throw new Error('Invalid proxy URL');
    }

    const proxy = new URL(url);

    if (!proxy.hostname || proxy.hostname.length <= 0) {
        throw new Error('Invalid proxy hostname');
    }

    const host = decodeURIComponent(proxy.hostname);
    const protocol = proxy.protocol ?? 'http:';
    let port = 0;

    if (proxy.port && proxy.port.length > 0) {
        port = parseInt(
            proxy.port,
            10
        );
    }

    if (!port) {
        if (protocol === 'https:') {
            port = 443;
        } else {
            port = 80;
        }
    }

    let auth: AxiosBasicCredentials | undefined;

    if (
        proxy.username && proxy.username.length > 0 &&
        proxy.password && proxy.password.length > 0) {
        auth = {
            username: decodeURIComponent(proxy.username),
            password: decodeURIComponent(proxy.password),
        };
    } else {
        auth = void 0;
    }

    return {
        protocol,
        host,
        port,
        auth,
    };
}


function createPayload(): any {
    return {
        version: 2,
        installId: 'fe29445e-b0d5-4d7a-91d3-f6d602e56a1f',
        mode: 'connector',
        connectorType: 'datacenter-local',
        proxyId: 'c8785045-3fc7-44c4-9068-9026f51fb5da',
        requests: 0,
        requestsValid: 0,
        requestsInvalid: 0,
        bytesReceived: 0,
        bytesSent: 0,
    };
}


async function makeRequestOnScrapoxyHttp(
    proxyUrl: any, https: boolean, post: boolean, retry = 2
): Promise<void> {
    const proxy = parseProxy(proxyUrl);
    const start = process.hrtime();
    try {
        const url = `${https ? 'https:' : 'http:' }//fingerprint.scrapoxy.io/api/json`;
        let res: AxiosResponse;

        if (post) {
            res = await axios.post(
                url,
                createPayload(),
                {
                    proxy,
                }
            );
        } else {
            res = await axios.get(
                url,
                {
                    params: createPayload(),
                    proxy,
                }
            );
        }

        const end = process.hrtime(start);

        console.log(`> SCRAPOXY [${post ? 'POST' : 'GET'}] ${proxy.protocol} -> ${https ? 'https' : 'http'}: IP is ${res.data.ip} from ${res.data.cityName}/${res.data.countryName} in ${formatHrTime(end)}`);
    } catch (err: any) {
        if (retry > 0) {
            console.error(`> SCRAPOXY [${post ? 'POST' : 'GET'}] ${proxy.protocol} -> ${https ? 'https' : 'http'}: retrying...`);
            await makeRequestOnScrapoxyHttp(
                proxyUrl,
                https,
                post,
                retry - 1
            );
        } else {
            console.error(`> SCRAPOXY [${post ? 'POST' : 'GET'}] ${proxy.protocol} -> ${https ? 'https' : 'http'}: ${err.message}`);
        }
    }
}


async function makeRequestOnScrapoxyHttpConnect(
    proxyUrl: string, post: boolean, retry = 2
): Promise<void> {
    const httpsAgent = new HttpsProxyAgent(proxyUrl);
    const start = process.hrtime();
    try {
        let res: AxiosResponse;

        if (post) {
            res = await axios.get(
                'https://fingerprint.scrapoxy.io/api/json',
                {
                    params: createPayload(),
                    httpsAgent,
                }
            );
        } else {
            res = await axios.post(
                'https://fingerprint.scrapoxy.io/api/json',
                createPayload(),
                {
                    httpsAgent,
                }
            );
        }

        const end = process.hrtime(start);
        console.log(`> SCRAPOXY [${post ? 'POST' : 'GET'}] connect -> https: IP is ${res.data.ip} from ${res.data.cityName}/${res.data.countryName} in ${formatHrTime(end)}`);
    } catch (err: any) {
        if (retry > 0) {
            console.error(`> SCRAPOXY [${post ? 'POST' : 'GET'}] connect -> https: retrying...`);
            await makeRequestOnScrapoxyHttpConnect(
                proxyUrl,
                post,
                retry - 1
            );
        } else {
            console.error(`> SCRAPOXY [${post ? 'POST' : 'GET'}] connect -> https: ${err.message}`);
        }
    } finally {
        httpsAgent.destroy();
    }
}


async function makeRequestOnIpInfoHttp(
    proxyUrl: any, https: boolean, retry = 2
): Promise<void> {
    const proxy = parseProxy(proxyUrl);
    const start = process.hrtime();

    try {
        const res = await axios.get(
            `${https ? 'https:' : 'http:' }//ipinfo.io/json`,
            {
                params: createPayload(),
                proxy,
            }
        );
        const end = process.hrtime(start);
        console.log(`> IPINFO [GET] ${https ? 'https' : 'http'} -> https: IP is ${res.data.ip} from ${res.data.city}/${res.data.country} in ${formatHrTime(end)}`);
    } catch (err: any) {
        if (retry > 0) {
            console.error(`> IPINFO [GET] ${https ? 'https' : 'http'} -> https: retrying...`);
            await makeRequestOnIpInfoHttp(
                proxyUrl,
                https,
                retry - 1
            );
        } else {
            console.error(`> SCRAPOXY [GET] connect -> https: ${err.message}`);
        }
    }
}


async function makeRequestOnIpInfoHttpConnect(
    proxyUrl: string, retry = 2
): Promise<void> {
    const httpsAgent = new HttpsProxyAgent(proxyUrl);
    const start = process.hrtime();
    try {
        const res = await axios.get(
            'https://ipinfo.io/json',
            {
                httpsAgent,
            }
        );
        const end = process.hrtime(start);
        console.log(`> IPINFO [GET] connect -> https: IP is ${res.data.ip} from ${res.data.city}/${res.data.country} in ${formatHrTime(end)}`);
    } catch (err: any) {
        if (retry > 0) {
            console.error('> IPINFO [GET] connect -> https: retrying...');
            await makeRequestOnIpInfoHttpConnect(
                proxyUrl,
                retry - 1
            );
        } else {
            console.error(`> SCRAPOXY [GET] connect -> https: ${err.message}`);
        }
    } finally {
        httpsAgent.destroy();
    }
}


async function runAllTests(proxyUrl: string): Promise<void> {
    // Scrapoxy - GET
    await makeRequestOnScrapoxyHttp(
        proxyUrl,
        false,
        false
    );
    await makeRequestOnScrapoxyHttp(
        proxyUrl,
        true,
        false
    );
    await makeRequestOnScrapoxyHttpConnect(
        proxyUrl,
        false
    );

    // Scrapoxy - POST
    await makeRequestOnScrapoxyHttp(
        proxyUrl,
        false,
        true
    );
    await makeRequestOnScrapoxyHttp(
        proxyUrl,
        true,
        true
    );
    await makeRequestOnScrapoxyHttpConnect(
        proxyUrl,
        true
    );

    // IPInfo
    await makeRequestOnIpInfoHttp(
        proxyUrl,
        false
    );
    await makeRequestOnIpInfoHttp(
        proxyUrl,
        true
    );
    await makeRequestOnIpInfoHttpConnect(proxyUrl);
}

(async() => {
    const proxiesRaw = await fs.readFile(
        join(
            'tools',
            'test-proxy-provider.json'
        ),
        'utf-8'
    );
    const proxiesJson = JSON.parse(proxiesRaw.toString()) as IProxyCheck[];

    // Check configuration first
    for (const proxy of proxiesJson) {
        try {
            parseProxy(proxy.url);
        } catch (err: any) {
            console.error(`Invalid proxy configuration for '${proxy.name}': ${err.message}`);

            return;
        }
    }

    // Run tests
    for (const proxy of proxiesJson) {
        if (proxy.inactive) {
            console.log(`\nSkipping tests on '${proxy.name}'...`);
        } else {
            console.log(`\nRunning tests on '${proxy.name}':`);
            await runAllTests(proxy.url);
        }
    }
})()
    .then(() => {
        console.log('done');
    })
    .catch((err) => {
        console.error(err);
    });
