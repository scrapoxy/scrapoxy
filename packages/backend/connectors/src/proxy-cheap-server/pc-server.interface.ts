export enum EProxyCheapStatus {
    ACTIVE = 'ACTIVE',
}


export enum EProxyCheapNetworkType {
    ALL = 'ALL',
    DATACENTER = 'DATACENTER',
    MOBILE = 'MOBILE',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    RESIDENTIAL_STATIC = 'RESIDENTIAL_STATIC',
}


export const PROXY_CHEAP_NETWORK_TYPE_LIST = Object.keys(EProxyCheapNetworkType);


export enum EProxyCheapProxyType {
    HTTP = 'HTTP',
    HTTPS = 'HTTPS',
    SOCKS5 = 'SOCKS5',
}


export interface IConnectorProxyCheapServerCredential {
    key: string;
    secret: string;
}


export interface IConnectorProxyCheapServerConfig {
    networkType: EProxyCheapNetworkType;
}


export interface IProxyCheapProxy {
    id: number;
    status: EProxyCheapStatus;
    networkType: EProxyCheapNetworkType;
    authentication: {
        username: string;
        password: string;
    };
    connection: {
        connectIp: string;
        httpPort: number | null;
        httpsPort: number | null;
        socks5Port: number | null;
    };
    proxyType: EProxyCheapProxyType;
}


export interface IProxyCheapProxiesResponse {
    proxies: IProxyCheapProxy[];
}
