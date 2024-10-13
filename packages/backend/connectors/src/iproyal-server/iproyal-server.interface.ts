export interface IConnectorIproyalServerCredential {
    token: string;
}


export interface IConnectorIproyalServerConfig {
    product: string;

    country: string;
}


export interface IIproyalServerOrder {
    id: number;
    productName: string;
    orderDate: string;
}


export interface IIproyalServerOrderDetail {
    id: number;
    productName: string;
    location: string;
}


export interface IIproyalServerProxy {
    id: number;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    ip_address: string;
    port: number;
    username: string;
    password: string;
}


export interface IIproyalServerProxiesResponse {
    data: [{
        proxies: IIproyalServerProxy[];
    }];
}
