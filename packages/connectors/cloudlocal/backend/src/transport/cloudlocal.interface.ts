import type { IProxyToConnectConfigCloud } from '@scrapoxy/backend-sdk';
import type { IFingerprint } from '@scrapoxy/common';


export interface IProxyToConnectConfigCloudlocal extends IProxyToConnectConfigCloud {
    fingerprintForce: IFingerprint | null;
}
