export interface IConnectorNetnutCredential {
    username: string;
    password: string;
}


export enum EConnectorNetnutProxyType {
    RES = 'res',
    STC = 'stc',
    MOB = 'mob',
    DC = 'dc',

}


export interface IConnectorNetnutConfig {
    proxyType: EConnectorNetnutProxyType;
    country: string;
}


export interface IProxyNetnutSessionOptions extends IConnectorNetnutConfig {
    session: number;
}
