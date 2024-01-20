import type {
    IConnectorProxyLocalConfig,
    IConnectorProxyLocalCredential,
} from '../proxy-local.interface';
import type { IFingerprint } from '@scrapoxy/common';


export interface IConnectorProxyRefreshedConfigProxyLocal {
    url: string;
}


export interface IProxyToConnectConfigProxyLocal extends IConnectorProxyRefreshedConfigProxyLocal, IConnectorProxyLocalCredential, IConnectorProxyLocalConfig {
    fingerprintForce: IFingerprint | null;
}
