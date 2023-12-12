export enum EProxyrackQueryCredential {
    Countries = 'countries',
    Cities = 'cities',
    Isps = 'isps',
    ProxiesCount = 'proxies_count',
}


export interface IProxyrackQueryByCountry {
    country: string;
}
