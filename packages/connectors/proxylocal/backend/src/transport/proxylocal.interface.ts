import type {
    IConnectorProxylocalConfig,
    IConnectorProxylocalCredential,
} from '../proxylocal.interface';
import type { IFingerprint } from '@scrapoxy/common';


export interface IConnectorProxyRefreshedConfigProxylocal {
    url: string;
}


export interface IProxyToConnectConfigProxylocal extends IConnectorProxyRefreshedConfigProxylocal, IConnectorProxylocalCredential, IConnectorProxylocalConfig {
    fingerprintForce: IFingerprint | null;
}
