import {
    createHash,
    createHmac,
} from 'crypto';
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


export function hashHex(message: string): string {
    if (typeof message !== 'string') {
        message = JSON.stringify(message);
    }

    return createHash('sha256')
        .update(
            message,
            'utf8'
        )
        .digest('hex');

}


export function hmac(
    key: string | Buffer,
    message: string
): Buffer {
    return createHmac(
        'sha256',
        key
    )
        .update(
            message,
            'utf8'
        )
        .digest();
}


export function buildFilters(
    request: Record<string, any>,
    keyConverter: Record<string, string>
// eslint-disable-next-line @typescript-eslint/naming-convention
): { Name: string; Values: string[] }[] {
    return Object.entries(request)
        .flatMap(([
            key, value,
        ]) => {
            if (!keyConverter[ key ] || !value) {
                return [];
            }

            if (Array.isArray(value)) {
                return {
                    Name: keyConverter[ key ],
                    Values: value,
                };
            }

            return {
                Name: keyConverter[ key ],
                Values: [
                    value,
                ],
            };
        });
}
