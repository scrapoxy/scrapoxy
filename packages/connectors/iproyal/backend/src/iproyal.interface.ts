export interface IConnectorIproyalCredential {
    token: string;
}


export interface IConnectorIproyalConfig {
    product: string;

    country: string;
}


export interface IIproyalOrder {
    id: number;
    productName: string;
    orderDate: string;
}


export interface IIproyalOrderDetail {
    id: number;
    productName: string;
    location: string;
}


export interface IIproyalProxy {
    id: number;
    credentials: string;
}


export interface IIproyalProxiesResponse {
    data: IIproyalProxy[];
}
