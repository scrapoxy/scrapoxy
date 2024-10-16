import { EBrightdataProductType } from '@scrapoxy/common';


export interface IConnectorBrightdataCredential {
    token: string;
}


export interface IConnectorBrightdataConfig {
    zoneName: string;
    zoneType: EBrightdataProductType;
    country: string;
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


export interface IBrightdataZoneData {
    password: string[];
    plan: {
        product: EBrightdataProductType;
    };
}
