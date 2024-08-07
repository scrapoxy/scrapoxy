import {
    IncomingMessage,
    request,
} from 'http';
import {
    createConnection,
    Socket,
} from 'net';
import { connect } from 'tls';
import {
    ArrayHttpHeaders,
    isUrl,
    urlToUrlOptions,
} from '@scrapoxy/backend-sdk';
import { SCRAPOXY_HEADER_PREFIX_LC } from '@scrapoxy/common';
import { EHttpRequestMode } from './client.interface';
import type {
    IHttpRequest,
    IHttpResponse,
} from './client.interface';
import type { RequestOptions } from 'http';
import type { ConnectionOptions } from 'tls';


export class HttpClientError extends Error {
    constructor(
        message: string,
        public status: number | undefined
    ) {
        super(message);
    }
}


function parseHeaders(headers: ArrayHttpHeaders | { [key: string]: any } | undefined): ArrayHttpHeaders {
    if (!headers) {
        return new ArrayHttpHeaders();
    }

    if (headers instanceof ArrayHttpHeaders) {
        return headers;
    }

    const arrayHeaders = new ArrayHttpHeaders();

    for (const [
        key, value,
    ] of Object.entries(headers)) {
        arrayHeaders.addHeader(
            key,
            value.toString()
        );
    }

    return arrayHeaders;
}


export class HttpClient {
    get(
        url: string, options?: IHttpRequest
    ): Promise<IHttpResponse> {
        return this.request({
            ...options,
            method: 'GET',
            url,
        });
    }

    post(
        url: string, postData: any, options?: IHttpRequest
    ): Promise<IHttpResponse> {
        return this.request(
            {
                ...options,
                method: 'POST',
                url,
            },
            postData
        );
    }

    request(
        options: IHttpRequest, postData?: any
    ): Promise<IHttpResponse> {
        return new Promise<IHttpResponse>((
            resolve, reject
        ) => {
            const urlOptions = urlToUrlOptions(options.url);

            if (!urlOptions) {
                reject(new Error('Invalid URL'));

                return;
            }

            const headers = parseHeaders(options.headers);
            headers.setOrUpdateFirstHeader(
                'Host',
                `${urlOptions.hostname}:${urlOptions.port}`
            );

            let postDataRaw: string | undefined;

            if (postData) {
                if (typeof postData === 'string') {
                    postDataRaw = postData;
                } else if (typeof postData === 'object') {
                    postDataRaw = JSON.stringify(postData);
                    headers.setOrUpdateFirstHeader(
                        'Content-Type',
                        'application/json'
                    );
                } else {
                    throw new Error('Invalid postData type');
                }
            } else {
                postDataRaw = undefined;
            }

            let path: string;

            if (options.proxy && options.proxy.mode !== EHttpRequestMode.MITM) {
                path = options.url as string;
            } else {
                path = urlOptions.pathname;
            }

            const reqOptions: RequestOptions = {
                hostname: urlOptions.hostname,
                port: urlOptions.port,
                method: options.method ?? 'GET',
                path,
                headers: headers.toArray() as any,
                timeout: options.timeout,
                createConnection: (
                    opts,
                    oncreate
                ) => {
                    let socket: Socket;

                    if (options.proxy) {
                        if (options.proxy.mode && options.proxy.mode !== EHttpRequestMode.DEFAULT) {
                            const proxyHeaders = parseHeaders(options.proxy.headers);
                            const proxyReq = request({
                                method: 'CONNECT',
                                hostname: options.proxy.host,
                                port: options.proxy.port,
                                path: `${urlOptions.hostname}:${urlOptions.port}`,
                                headers: proxyHeaders.toArray() as any,
                                timeout: options.timeout,
                            });

                            proxyReq.on(
                                'error',
                                (err: any) => {
                                    oncreate(
                                        err,
                                        void 0 as any
                                    );
                                }
                            );

                            proxyReq.on(
                                'connect',
                                (
                                    res, proxySocket
                                ) => {
                                    if (res.statusCode !== 200) {
                                        oncreate(
                                            new Error(res.headers[ `${SCRAPOXY_HEADER_PREFIX_LC}-proxyerror` ] as string || res.statusMessage),
                                            void 0 as any
                                        );

                                        return;
                                    }

                                    const connectOptions: ConnectionOptions = {
                                        socket: proxySocket,
                                        requestCert: true,
                                        rejectUnauthorized: false,
                                        timeout: options.timeout,
                                    };

                                    if (isUrl(urlOptions.hostname)) {
                                        connectOptions.servername = urlOptions.hostname;
                                    }

                                    if (options.proxy!.ca) {
                                        connectOptions.ca = options.proxy!.ca;
                                    }

                                    const connectSocket = connect(connectOptions);

                                    connectSocket.on(
                                        'error',
                                        (err) => {
                                            oncreate(
                                                err,
                                                void 0 as any
                                            );
                                        }
                                    );

                                    connectSocket.on(
                                        'timeout',
                                        () => {
                                            connectSocket.destroy();
                                            connectSocket.emit('close');
                                        }
                                    );

                                    oncreate(
                                        void 0 as any,
                                        connectSocket
                                    );
                                }
                            );

                            proxyReq.end();

                            return void 0 as any;
                        }

                        socket = createConnection({
                            host: options.proxy.host,
                            port: options.proxy.port,
                            timeout: options.timeout,
                        });
                    } else {
                        if (urlOptions.protocol === 'https:') {
                            const connectOptions: ConnectionOptions = {
                                host: urlOptions.hostname,
                                port: urlOptions.port,
                                requestCert: true,
                                rejectUnauthorized: false,
                                timeout: options.timeout,
                            };

                            if (isUrl(urlOptions.hostname)) {
                                connectOptions.servername = urlOptions.hostname;
                            }

                            socket = connect(connectOptions);
                        } else {
                            socket = createConnection({
                                host: urlOptions.hostname,
                                port: urlOptions.port,
                                timeout: options.timeout,
                            });
                        }
                    }

                    socket.on(
                        'error',
                        (err: any) => {
                            oncreate(
                                err,
                                void 0 as any
                            );
                        }
                    );

                    socket.on(
                        'timeout',
                        () => {
                            socket.destroy();
                            socket.emit('close');
                        }
                    );

                    oncreate(
                        void 0 as any,
                        socket
                    );

                    return socket;
                },
            };
            const req = request(
                reqOptions,
                (res: IncomingMessage) => {
                    const chunks: Buffer[] = [];

                    res.on(
                        'error',
                        (err: Error) => {
                            reject(new HttpClientError(
                                err.message,
                                res.statusCode
                            ));
                        }
                    );

                    res.on(
                        'data',
                        (chunk) => {
                            chunks.push(chunk);
                        }
                    );

                    res.on(
                        'end',
                        () => {
                            let data = Buffer.concat(chunks)
                                .toString();

                            if (res.headers[ 'content-type' ]?.includes('application/json')) {
                                try {
                                    data = JSON.parse(data);
                                } catch (err: any) {
                                    // Ignore
                                }
                            }

                            const response: IHttpResponse = {
                                status: res.statusCode,
                                statusText: res.statusMessage,
                                headers: new ArrayHttpHeaders(res.rawHeaders),
                                data,
                            };

                            resolve(response);
                        }
                    );
                }
            );

            req.on(
                'error',
                (err: Error) => {
                    reject(new HttpClientError(
                        err.message,
                        void 0
                    ));
                }
            );

            if (postDataRaw) {
                req.end(postDataRaw);
            } else {
                req.end();
            }
        });
    }
}
