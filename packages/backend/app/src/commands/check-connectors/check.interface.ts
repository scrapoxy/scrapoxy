import type { IConnectorListProxies } from '@scrapoxy/common';


export interface ICheckConnectorRequest {
    type: string;

    name: string;

    credential: any;

    maxProxies: number;
}


export interface ICheckConnectorResponse extends IConnectorListProxies{
    type: string;

    name: string;

    maxProxies: number;
}
