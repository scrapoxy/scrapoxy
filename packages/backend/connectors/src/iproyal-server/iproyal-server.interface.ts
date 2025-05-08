export interface IConnectorIproyalServerCredential {
    token: string;
}


export interface IConnectorIproyalServerConfig {
    productId: number;

    country: string;
}


export interface IIproyalServerProxiesResponse<T> {
    data: T;
}


export interface IIproyalServerProxy {
    username: string;
    password: string;
    ip: string;
}


export interface IIproyalServerOrder {
    id: number;
    location: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    proxy_data: {
        ports: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'http|https': number;
        };
        proxies: IIproyalServerProxy[];
    };
}
