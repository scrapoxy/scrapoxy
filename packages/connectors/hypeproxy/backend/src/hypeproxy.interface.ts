export interface IConnectorHypeproxyCredential {
    token: string;
}


export interface IHypeproxyProxy {
    id: string;
    shortId: string;
    hub: string;
    httpPort: number;
    user: string;
    password: string;
}
