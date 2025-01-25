import { EEvomiProduct } from '@scrapoxy/common';


export interface IConnectorEvomiCredential {
    apiKey: string;
}


export interface IConnectorEvomiConfig {
    product: EEvomiProduct;
    hostname: string | null;
    port: number;
    username: string | null;
    password: string | null;
    country: string;
}


export interface IEvomiPorts {
    http: number;
    // socks not used in Scrapoxy
}


export interface IEvomiProductResidential {
    username: string;
    password: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    balance_mb: number;
    endpoint: string;
    ports: IEvomiPorts;
}


export interface IEvomiProductServerIp {
    password: string;
    ipInfo: {
        ip: string;
        country: string;
    };
}


export interface IEvomiProductServerPackage {
    username: string;
    expiryDate: string;
    ips: IEvomiProductServerIp[];
}


export interface IEvomiProductServer {
    packages: IEvomiProductServerPackage[];
    ports: IEvomiPorts;
}
