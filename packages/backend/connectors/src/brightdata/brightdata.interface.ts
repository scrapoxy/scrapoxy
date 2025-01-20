import { EBrightdataProductType } from '@scrapoxy/common';


export interface IConnectorBrightdataCredential {
    token: string;
}


export interface IConnectorBrightdataConfig {
    zoneName: string;
    productType: EBrightdataProductType;
    username: string;
    password: string;
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


export interface IBrightdataZone {
    name: string;
    type: string;

}


export enum EBrightdataCountryProductType {
    DatacenterShared = 'DC_shared',
    DatacenterDedicatedIp = 'DC_dedicated_ip',
    DatacenterDedicatedHost = 'DC_dedicated_host',
    IspShared = 'ISP_shared',
    IspDedicatedIp = 'ISP_dedicated_ip',
    IspDedicatedHost = 'ISP_dedicated_host',
}


export interface IBrightdataZonesCountries {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    zone_type: { [key: string]: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        country_codes: string[];
    }; };
}


export interface IBrightdataZoneData {
    password: string[];
    plan: {
        product: string;
        // eslint-disable-next-line @typescript-eslint/naming-convention
        ips_type?: string;
        // eslint-disable-next-line @typescript-eslint/naming-convention
        vips_type?: string;
        bandwidth: string;
        // eslint-disable-next-line @typescript-eslint/naming-convention
        vip_country?: string;
    };
}
