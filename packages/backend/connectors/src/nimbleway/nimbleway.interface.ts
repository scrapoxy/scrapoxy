export interface IConnectorNimblewayCredential {
    username: string;

    password: string;
}


export interface IConnectorNimblewayConfig {
    country: string;
}


export interface INimblewaySessionOptions {
    session: string;
    country: string;
}
