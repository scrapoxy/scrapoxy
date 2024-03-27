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


export interface IIproyalResidentialSessionOptions {
    session: string;
    lifetime: string;
    country: string;
    state: string;
    city: string;
    highEndPool: boolean;
}
