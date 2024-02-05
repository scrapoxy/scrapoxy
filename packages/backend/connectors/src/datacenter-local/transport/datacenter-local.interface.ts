import type { IProxyToConnectConfigDatacenter } from '@scrapoxy/backend-sdk';
import type { IFingerprint } from '@scrapoxy/common';


export interface IProxyToConnectConfigDatacenterLocal extends IProxyToConnectConfigDatacenter {
    fingerprintForce: IFingerprint | null;
}
