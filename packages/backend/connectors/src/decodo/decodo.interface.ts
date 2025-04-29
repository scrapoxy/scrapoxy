import { EDecodoCredentialType } from '@scrapoxy/common';


export interface IConnectorDecodoCredential {
    credentialType: EDecodoCredentialType;
    username: string;
    password: string;
}


export interface IConnectorDecodoConfig {
    country: string;
    sessionDuration: number;
}


export interface IDecodoEndpoint {
    code: string;
    hostname: string;
    portMin: number;
    portMax: number;
}
