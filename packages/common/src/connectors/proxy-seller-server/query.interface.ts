export enum EProxySellerServerQueryCredential {
    Countries = 'countries',
}


export enum EProxySellerNetworkType {
    ALL = 'all',
    IPV4 = 'ipv4',
    ISP = 'isp',
    MOBILE = 'mobile',
}


export interface IConnectorProxySellerServerQueryType {
    networkType: EProxySellerNetworkType;
}
