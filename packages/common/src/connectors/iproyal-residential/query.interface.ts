export enum EIproyalResidentialQueryCredential {
    Countries = 'countries',
}


export interface IIproyalResidentialItem {
    code: string;
    name: string;
}


export interface IIproyalResidentialCountries {
    countries: IIproyalResidentialCountry[];
}


export interface IIproyalResidentialCountry extends IIproyalResidentialItem {
    cities: {
        options: IIproyalResidentialItem[];
    };
    states: {
        options: IIproyalResidentialItem[];
    };
}
