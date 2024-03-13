import { EProxySellerNetworkType } from '@scrapoxy/common';


export interface IConnectorProxySellerServerCredential {
    token: string;
}


export interface IConnectorProxySellerServerConfig {
    networkType: EProxySellerNetworkType;
    country: string;
}


export enum EProxySellerProxyProtocol {
    HTTP = 'HTTP',
    SOCKS = 'SOCKS',
}


export enum EProxySellerProxyStatus {
    ACTIVE = 'ACTIVE',
}


export interface IProxySellerProxy {
    id: string;
    networkType: EProxySellerNetworkType;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    ip_only: string;
    protocol: EProxySellerProxyProtocol;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    port_http: number;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    port_socks: number;
    login: string;
    password: string;
    country: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    status_type: EProxySellerProxyStatus;
}


export interface IProxySellerGetProxiesAll {
    ipv4: IProxySellerProxy[];
    isp: IProxySellerProxy[];
    mobile: IProxySellerProxy[];
}


export interface IProxySellerGetProxiesItems {
    items: IProxySellerProxy[];
}


export enum EProxySellerServerResponseStatus {
    SUCCESS = 'success',
}


export interface IProxySellerServerResponseError {
    code: number;
    message: string;
}


export interface IProxySellerServerResponse<T> {
    status: EProxySellerServerResponseStatus;
    data: T;
    errors?: IProxySellerServerResponseError[];
}
