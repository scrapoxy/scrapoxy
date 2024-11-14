export interface IConnectorIproyalResidentialCredential {
    username: string;
    password: string;
}


export interface IConnectorIproyalResidentialConfig {
    lifetime: string;
    country: string;
    highEndPool: boolean;
}


export interface IIproyalResidentialSessionOptions {
    session: string;
    lifetime: string;
    country: string;
    highEndPool: boolean;
}
