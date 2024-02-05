import type { IOptionalValue } from '../../optional';


export interface IConnectorFreeproxyConfig {
    freeproxiesTimeoutDisconnected: number;
    freeproxiesTimeoutUnreachable: IOptionalValue<number>;
}
