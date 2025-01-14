import {
    IncomingMessage,
    request,
} from 'http';
import {
    parseError,
    Sockets,
} from '@scrapoxy/proxy-sdk';
import {
    ArrayHttpHeaders,
    formatUseragent,
    urlToUrlOptions,
} from '../helpers';
import type { ATransportService } from '../transports';
import type {
    IFingerprint,
    IFingerprintOptions,
    IFingerprintRequest,
    IFingerprintResponseRaw,
    IProxyToRefresh,
} from '@scrapoxy/common';
import type { ClientRequestArgs } from 'http';


class RedirectError extends Error {
    constructor(public readonly location: string) {
        super();
    }
}


function fingerprintRequest(args: ClientRequestArgs): Promise<IFingerprintResponseRaw> {
    return new Promise<IFingerprintResponseRaw>((
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

                        const body = Buffer.concat(buffers)
                            .toString();

                        if (response.statusCode === 200) {
                            try {
                                resolve({
                                    headers: response.headers,
                                    body,
                                });
                            } catch (err: any) {
                                reject(err);
                            }
                        } else {
                            reject(new Error(`Get ${response.statusCode} status code: ${body}`));
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

        req.end();
    });
}


function fingerprintImpl(
    url: string,
    transport: ATransportService,
    proxy: IProxyToRefresh,
    fpRequest: IFingerprintRequest,
    sockets: Sockets,
    useragent: string,
    followRedirectCount: number,
    retry: number
): Promise<IFingerprint> {
    const urlOpts = urlToUrlOptions(url);

    if (!urlOpts) {
        throw new Error('Invalid url');
    }

    urlOpts.pathname += '?version=2'
        + '&installId=' + fpRequest.installId
        + '&mode=' + fpRequest.mode
        + '&connectorType=' + fpRequest.connectorType
        + '&proxyId=' + encodeURIComponent(fpRequest.proxyId)
        + '&requests=' + proxy.requests
        + '&requestsValid=' + proxy.requestsValid
        + '&requestsInvalid=' + proxy.requestsInvalid
        + '&bytesReceived=' + proxy.bytesReceived
        + '&bytesSent=' + proxy.bytesSent;

    const reqArgs = transport.buildFingerprintRequestArgs(
        'GET',
        urlOpts,
        new ArrayHttpHeaders()
            .addHeader(
                'Host',
                urlOpts.hostname as string
            )
            .addHeader(
                'User-Agent',
                useragent
            ),
        {
            Host: `${urlOpts.hostname}:${urlOpts.port}`,
        },
        proxy,
        sockets
    );

    return fingerprintRequest(reqArgs)
        .then((response) => transport.parseFingerprintResponse(response))
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
                    fpRequest,
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
                    fpRequest,
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
    transport: ATransportService,
    proxy: IProxyToRefresh,
    options: IFingerprintOptions,
    fpRequest: IFingerprintRequest,
    sockets: Sockets
): Promise<IFingerprint> {
    return fingerprintImpl(
        options.url,
        transport,
        proxy,
        fpRequest,
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
