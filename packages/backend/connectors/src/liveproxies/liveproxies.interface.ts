import { ELiveproxiesPlanStatus } from '@scrapoxy/common';


export interface IConnectorLiveproxiesCredential {
    apiKey: string;
}


export interface IConnectorLiveproxiesConfig {
    packageId: number;
    productName: string;
    country: string;
}


export interface ILiveproxiesProxyList {
    serverIp: string;
    loginName: string;
    loginPassword: string;
    accessPoint: string;
    ipQuantity: number;
}


export interface ILiveproxiesPlanB2B {
    packageId: number;
    username: string;
    password: string;
    packageStatus: ELiveproxiesPlanStatus;
    productName: string;
}
