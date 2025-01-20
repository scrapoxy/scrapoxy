import { TRANSPORT_HARDWARE_TYPE } from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_PROXIDIZE_TYPE,
    EProxyStatus,
    EProxyType,


} from '@scrapoxy/common';
import { EProxidizeDeviceStatus } from './proxidize.interface';
import type { IProxidizeDevice } from './proxidize.interface';
import type {
    IConnectorProxyRefreshed,
    IProxyTransport,
} from '@scrapoxy/common';


function convertStatus(status: EProxidizeDeviceStatus): EProxyStatus {
    if (!status) {
        return EProxyStatus.ERROR;
    }

    switch (status) {
        case EProxidizeDeviceStatus.CONNECTED:
            return EProxyStatus.STARTED;
        case EProxidizeDeviceStatus.ROTATING:
            return EProxyStatus.STARTING;
        case EProxidizeDeviceStatus.NOSERVICE:
            return EProxyStatus.STOPPED;
        default:
            return EProxyStatus.ERROR;
    }
}


export function convertToProxy(
    d: IProxidizeDevice,
    hostname: string
): IConnectorProxyRefreshed {
    const config: IProxyTransport = {
        type: EProxyType.HTTP,
        address: {
            hostname,
            port: d.Port,
        },
        auth: null,
    };
    const p: IConnectorProxyRefreshed = {
        type: CONNECTOR_PROXIDIZE_TYPE,
        transportType: TRANSPORT_HARDWARE_TYPE,
        key: d.Index.toString(10),
        name: d.public_ip_http_ipv4,
        status: convertStatus(d.Status),
        removingForceCap: true,
        config,
        countryLike: null, // Not used because it is hardware.
    };

    return p;
}
