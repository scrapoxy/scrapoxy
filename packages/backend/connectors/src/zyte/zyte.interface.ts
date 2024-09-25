import { EZyteCredentialType } from '@scrapoxy/common';


export interface IConnectorZyteCredential {
    credentialType: EZyteCredentialType;
    token: string;
}


export interface IConnectorZyteConfig {
    region: string;
    apiUrl: string;
}
