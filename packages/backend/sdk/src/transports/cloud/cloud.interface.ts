import type {
    IAddress,
    ICertificate,
} from '@scrapoxy/common';


export interface ITransportProxyRefreshedConfigCloud {
    address: IAddress | undefined;
}


export interface IProxyToConnectConfigCloud {
    address: IAddress;
    certificate: ICertificate;
}
