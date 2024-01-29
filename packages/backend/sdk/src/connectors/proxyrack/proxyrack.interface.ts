export interface IConnectorProxyrackCredential {
    product: EProxyrackProductType;

    username: string;

    password: string;
}


export interface IConnectorProxyrackConfig {
    country: string;

    city: string;

    isp: string;

    osName: EProxyrackOs;
}


export enum EProxyrackProductType {
    PrivateUnmeteredResidential = 'private_unmetered_residential',
}


export enum EProxyrackOs {
    All = 'all',
    Windows = 'Windows',
    Linux = 'Linux',
    MacOs = 'Mac OS X',
    FreeBSD = 'FreeBSD',
}


export interface IProxyrackSession {
    session: string;
    proxy: {
        online: true;
    };
}


export interface IProxyrackSessionOptions {
    session: string;
    country: string;
    city: string;
    isp: string;
    osName: EProxyrackOs;
}
