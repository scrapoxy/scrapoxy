import { ArrayHttpHeaders } from '@scrapoxy/backend-sdk';


export enum EHttpRequestMode {
    DEFAULT = 'DEFAULT',
    MITM = 'MITM',
    TUNNEL = 'TUNNEL',
}


export interface IHttpRequest {
    url?: string;
    method?: string;
    headers?: ArrayHttpHeaders | { [key: string]: any };
    timeout?: number;
    proxy?: {
        mode?: EHttpRequestMode;
        host: string;
        port: number;
        ca?: string;
        headers?: ArrayHttpHeaders | { [key: string]: any };
    };
}


export interface IHttpResponse {
    status: number | undefined;
    statusText: string | undefined;
    headers: ArrayHttpHeaders;
    data: any;
}
