import type { IConnectorHardwareCredential } from '../../transports';


export interface IConnectorProxidizeCredential extends IConnectorHardwareCredential {
    apiUrl: string;
    apiToken: string;
    proxyHostname: string;
}


export enum EProxidizeDeviceStatus {
    ROTATING = 'Rotating',
    CONNECTED = 'Connected IPv4',
    NOSERVICE = 'No Service',
}


export interface IProxidizeDevice {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Index: number;

    // eslint-disable-next-line @typescript-eslint/naming-convention
    public_ip_http_ipv4: string;

    // eslint-disable-next-line @typescript-eslint/naming-convention
    Port: number;

    // eslint-disable-next-line @typescript-eslint/naming-convention
    Status: EProxidizeDeviceStatus;
}
