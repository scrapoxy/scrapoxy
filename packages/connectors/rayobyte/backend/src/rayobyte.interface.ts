export interface IConnectorRayobyteCredential {
    email: string;
    apiKey: string;
}


export interface IConnectorRayobyteConfig {
    packageFilter: string;
}


export interface IAvailableReplacement {
    country: string;
    category: string;
    available: number;
}
