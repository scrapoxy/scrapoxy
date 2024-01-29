import type { IConnectorHardwareCredential } from '../../transports';


export interface IConnectorXProxyCredential extends IConnectorHardwareCredential {
    apiUrl: string;
    apiUsername: string;
    apiPassword: string;
    proxyHostname: string;
}


export interface IXProxyData<T> {
    data: T;
}


export interface IXProxyDevice {
    position: number;

    host: string;

    // eslint-disable-next-line @typescript-eslint/naming-convention
    proxy_port: number;

    // eslint-disable-next-line @typescript-eslint/naming-convention
    public_ip: string;

    // eslint-disable-next-line @typescript-eslint/naming-convention
    device_extra_info: {
        connected: boolean;
    };
}
