import type { IProxySellerGeoCountryView } from '@scrapoxy/common';


export interface IConnectorProxySellerResidentialCredential {
    token: string;
}


export interface IConnectorProxySellerResidentialConfig {
    countryCode: string;

    region: string;

    city: string;

    isp: string;

    title: string;
}


export interface IProxySellerResidentList {
    id: number;
    title: string;
    login: string;
    password: string;
    export: {
        ports: number;
    };
}


export interface IProxySellerResidentListCreate {
    title: string;
    whitelist: string;
    geo: {
        country: string;
        region: string;
        city: string;
        isp: string;
    };
    export: {
        ports: number;
        ext: string;
    };
}


export interface IProxySellerGeoCityData {
    name: string;
    isps: string[];
}


export interface IProxySellerGeoRegionData {
    name: string;
    cities: IProxySellerGeoCityData[];
}

export interface IProxySellerGeoCountryData extends IProxySellerGeoCountryView {
    regions: IProxySellerGeoRegionData[];
}


export enum EProxySellerResidentialResponseStatus {
    SUCCESS = 'success',
}


export interface IProxySellerResidentialResponseError {
    code: number;
    message: string;
}


export interface IProxySellerResidentialResponse<T> {
    status: EProxySellerResidentialResponseStatus;
    data: T;
    errors?: IProxySellerResidentialResponseError[];
}
