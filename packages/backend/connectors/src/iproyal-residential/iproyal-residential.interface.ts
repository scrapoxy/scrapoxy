export interface IConnectorIproyalResidentialCredential {
    token: string;
    username: string;
    password: string;
}


export interface IConnectorIproyalResidentialConfig {
    lifetime: string;
    country: string;
    state: string;
    city: string;
    highEndPool: boolean;
}


export interface IIproyalResidentialProxy {
    id: number;
    credentials: string;
}


export interface IIproyalResidentialProxiesResponse {
    data: IIproyalResidentialProxy[];
}


export interface IIproyalResidentialSessionOptions {
    session: string;
    lifetime: string;
    country: string;
    state: string;
    city: string;
    highEndPool: boolean;
}
