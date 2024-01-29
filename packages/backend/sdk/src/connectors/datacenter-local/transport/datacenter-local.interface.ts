import type { IProxyToConnectConfigDatacenter } from '../../../transports';
import type { IFingerprint } from '@scrapoxy/common';


export interface IProxyToConnectConfigDatacenterLocal extends IProxyToConnectConfigDatacenter {
    fingerprintForce: IFingerprint | null;
}
