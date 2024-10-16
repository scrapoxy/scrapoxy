import { EGeonodeProductType } from './geonode.interface';


export enum EGeonodeQueryCredential {
    Countries = 'countries',
}


export interface IGeonodeQueryCountries {
    productType: EGeonodeProductType;
}
