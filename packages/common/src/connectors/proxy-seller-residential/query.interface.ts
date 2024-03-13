export enum EProxySellerResidentialQueryCredential {
    Countries = 'countries',
    Regions = 'regions',
    Cities = 'cities',
    Isps = 'isps',
}


export interface IConnectorProxySellerResidentialQueryRegions {
    countryCode: string;
}


export interface IConnectorProxySellerResidentialQueryCities extends IConnectorProxySellerResidentialQueryRegions {
    region: string;
}


export interface IConnectorProxySellerResidentialQueryIsps extends IConnectorProxySellerResidentialQueryCities {
    city: string;
}
