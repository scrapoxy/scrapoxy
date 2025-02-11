import { TRANSPORT_DATACENTER_TYPE } from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_AWS_TYPE,
    EProxyStatus,
} from '@scrapoxy/common';
import type { ITencentInstance } from './tencent.interface';
import type { ITransportProxyRefreshedConfigDatacenter } from '@scrapoxy/backend-sdk';
import type { IConnectorProxyRefreshed } from '@scrapoxy/common';


export function convertToProxy(
    i: ITencentInstance,
    port: number,
    region: string
): IConnectorProxyRefreshed {
    const config: ITransportProxyRefreshedConfigDatacenter = {
        address: i.PublicIpAddresses && i.PublicIpAddresses.length > 0 ? {
            hostname: i.PublicIpAddresses[ 0 ],
            port,
        } : void 0,
    };
    const proxy: IConnectorProxyRefreshed = {
        type: CONNECTOR_AWS_TYPE,
        transportType: TRANSPORT_DATACENTER_TYPE,
        key: i.InstanceId,
        name: i.InstanceId,
        config,
        status: EProxyStatus.STARTING,
        removingForceCap: false,
        countryLike: region,
    };

    return proxy;
}
