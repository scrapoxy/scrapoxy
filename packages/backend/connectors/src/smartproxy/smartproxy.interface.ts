import { ESmartproxyCredentialType } from '@scrapoxy/common';


export interface IConnectorSmartproxyCredential {
    credentialType: ESmartproxyCredentialType;
    username: string;
    password: string;
}


export interface IConnectorSmartproxyConfig {
    country: string;
    sessionDuration: number;
}


export interface ISmartproxyEndpoint {
    code: string;
    hostname: string;
    portMin: number;
    portMax: number;
}
