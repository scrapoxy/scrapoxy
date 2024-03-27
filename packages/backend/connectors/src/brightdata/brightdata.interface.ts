export interface IConnectorBrightdataCredential {
    token: string;
}


export interface IConnectorBrightdataConfig {
    zone: string;
}


export interface ITransportProxyRefreshedConfigBrightdata {
    username: string;
    password: string;
}


export enum EBrightdataStatus {
    ACTIVE = 'active',
}


export interface IBrightdataStatus {
    customer: string;
    status: EBrightdataStatus;
}


export enum EBrightdataProductType {
    DATACENTER = 'dc',
    ISP = 'res_static',
    RESIDENTIAL = 'res_rotating',
    MOBILE = 'mobile',
}


export const BRIGHTDATA_PRODUCT_TYPES = Object.values(EBrightdataProductType);


export interface IBrightdataZoneView {
    name: string;
    type: EBrightdataProductType;
}


export interface IBrightdataZoneData {
    password: string[];
    plan: {
        product: EBrightdataProductType;
    };
}
