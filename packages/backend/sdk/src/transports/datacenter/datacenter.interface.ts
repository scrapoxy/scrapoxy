import type {
    IAddress,
    ICertificate,
} from '@scrapoxy/common';


export interface ITransportProxyRefreshedConfigDatacenter {
    address: IAddress | undefined;
}


export interface IProxyToConnectConfigDatacenter {
    address: IAddress;
    certificate: ICertificate | null;
}
