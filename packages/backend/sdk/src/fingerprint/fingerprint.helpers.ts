import {
    IncomingMessage,
    request,
} from 'http';
import {
    parseError,
    Sockets,
} from '@scrapoxy/proxy-sdk';
import {
    formatUseragent,
    urlToUrlOptions,
} from '../helpers';
import type { ITransportService } from '../transports';
import type {
    IFingerprint,
    IFingerprintOptions,
    IFingerprintPayload,
    IFingerprintRequest,
    IProxyToRefresh,
} from '@scrapoxy/common';
import type { ClientRequestArgs } from 'http';


class RedirectError extends Error {
    constructor(public readonly location: string) {
        super();
    }
}


function fingerprintRequest(
    args: ClientRequestArgs,
    payload: IFingerprintPayload
) {
    return new Promise<IFingerprint>((
        resolve, reject
    ) => {
        let timeout: NodeJS.Timeout | undefined = void 0;
        const req = request(
            args,
            (response: IncomingMessage) => {
                if (response.statusCode &&
                    response.statusCode > 300 &&
                    response.statusCode < 400) {
                    const locationHeader = response.headers.location;

                    if (locationHeader && locationHeader.length > 0) {
                        reject(new RedirectError(locationHeader));

                        return;
                    }
                }

                const buffers: Buffer[] = [];
                response.on(
                    'error',
                    (err: any) => {
                        err = parseError(err);

                        if (timeout) {
                            clearTimeout(timeout);
                        }

                        reject(err);
                    }
                );

                response.on(
                    'end',
                    () => {
                        if (timeout) {
                            clearTimeout(timeout);
                            timeout = void 0;
                        }

                        const rawData = Buffer.concat(buffers)
                            .toString();

                        if (response.statusCode === 200) {
                            try {
                                const data = JSON.parse(rawData) as IFingerprint;

                                resolve(data);
                            } catch (err: any) {
                                reject(err);
                            }
                        } else {
                            reject(new Error(`Get ${response.statusCode} status code: ${rawData}`));
                        }
                    }
                );

                response.on(
                    'data',
                    (buffer: Buffer) => {
                        buffers.push(buffer);
                    }
                );
            }
        );

        req.on(
            'error',
            (err: any) => {
                err = parseError(err);

                if (timeout) {
                    clearTimeout(timeout);
                    timeout = void 0;
                }

                reject(err);
            }
        );

        if (args.timeout && args.timeout > 0) {
            timeout = setTimeout(
                () => {
                    timeout = void 0;
                    req.emit(
                        'error',
                        new Error('Request timeout')
                    );
                },
                args.timeout as number
            );
        }

        const payloadRaw = JSON.stringify(payload);

        req.end(payloadRaw);
    });
}


function fingerprintImpl(
    url: string,
    transport: ITransportService,
    proxy: IProxyToRefresh,
    payload: IFingerprintRequest,
    sockets: Sockets,
    useragent: string,
    followRedirectCount: number,
    retry: number
): Promise<IFingerprint> {
    const urlOpts = urlToUrlOptions(url);

    if (!urlOpts) {
        throw new Error('Invalid url');
    }

    const reqArgs = transport.buildFingerprintRequestArgs(
        'POST',
        urlOpts,
        {
            Host: urlOpts.hostname,
            'Content-Type': 'application/json',
            'User-Agent': useragent,
        },
        {
            Host: `${urlOpts.hostname}:${urlOpts.port}`,
        },
        proxy,
        sockets
    );
    const fingerprintPayload: IFingerprintPayload = {
        ...payload,
        requests: proxy.requests,
        bytesReceived: proxy.bytesReceived,
        bytesSent: proxy.bytesSent,
    };

    return fingerprintRequest(
        reqArgs,
        fingerprintPayload
    )
        .catch((err: any) => {
            if (err instanceof RedirectError) {
                const location = (err as RedirectError).location;

                if (location === url) {
                    throw new Error('Cannot redirect to same location');
                }

                if (followRedirectCount <= 0) {
                    throw new Error('Too many redirects');
                }

                return fingerprintImpl(
                    location,
                    transport,
                    proxy,
                    payload,
                    sockets,
                    useragent,
                    followRedirectCount - 1,
                    retry
                );
            }

            if (retry > 0) {
                return fingerprintImpl(
                    url,
                    transport,
                    proxy,
                    payload,
                    sockets,
                    useragent,
                    followRedirectCount,
                    retry - 1
                );
            }

            throw err;
        });
}


export function fingerprint(
    transport: ITransportService,
    proxy: IProxyToRefresh,
    options: IFingerprintOptions,
    fingerprintPayload: IFingerprintRequest,
    sockets: Sockets
): Promise<IFingerprint> {
    return fingerprintImpl(
        options.url,
        transport,
        proxy,
        fingerprintPayload,
        sockets,
        options.useragent,
        options.followRedirectMax,
        options.retryMax
    );
}


export function getEnvFingerprintConfig(
    version: string,
    url?: string
): IFingerprintOptions {
    return {
        url: url && url.length > 0 ? url : process.env.FINGERPRINT_URL ?? 'https://fingerprint.scrapoxy.io/api/json',
        useragent: formatUseragent(version),
        followRedirectMax: parseInt(
            process.env.FINGERPRINT_FOLLOW_REDIRECT_MAX ?? '3',
            10
        ),
        retryMax: parseInt(
            process.env.FINGERPRINT_RETRY_MAX ?? '2',
            10
        ),
    };
}
