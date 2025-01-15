import { TRANSPORT_DATACENTER_TYPE } from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_AWS_TYPE,
    EProxyStatus,
} from '@scrapoxy/common';
import type { IAwsInstance } from './aws.interface';
import type { ITransportProxyRefreshedConfigDatacenter } from '@scrapoxy/backend-sdk';
import type { IConnectorProxyRefreshed } from '@scrapoxy/common';


const REGION_PREFIX_TO_COUNTRY_CODE: Record<string, string> = {
    us: 'us-',
    ca: 'ca-',
    cn: 'cn-',
    il: 'il-',
    mx: 'mx-',
};
const REGION_TO_COUNTRY_CODE: Record<string, string> = {
    'af-south-1': 'za',
    'ap-east-1': 'hk',
    'ap-south-2': 'in',
    'ap-southeast-3': 'id',
    'ap-southeast-5': 'my',
    'ap-southeast-4': 'au',
    'ap-south-1': 'in',
    'ap-northeast-3': 'jp',
    'ap-northeast-2': 'kr',
    'ap-southeast-1': 'sg',
    'ap-southeast-2': 'au',
    'ap-southeast-7': 'th',
    'ap-northeast-1': 'jp',
    'eu-central-1': 'de',
    'eu-west-1': 'ie',
    'eu-west-2': 'gb',
    'eu-south-1': 'it',
    'eu-west-3': 'fr',
    'eu-south-2': 'es',
    'eu-north-1': 'se',
    'eu-central-2': 'ch',
    'me-south-1': 'bh',
    'me-central-1': 'ae',
    'sa-east-1': 'br',
};


function convertRegionToCountryCode(region: string | null | undefined): string | null {
    if (!region) {
        return null;
    }

    const prefix = region.substring(
        0,
        3
    );
    const code = REGION_PREFIX_TO_COUNTRY_CODE[ prefix ];

    if (code) {
        return code;
    }

    return REGION_TO_COUNTRY_CODE[ region ] ?? null;
}


function convertStatus(code: string): EProxyStatus {
    switch (code) {
        case '0':
            return EProxyStatus.STARTING;
        case '16':
            return EProxyStatus.STARTED;
        case '32':
        case '64':
            return EProxyStatus.STOPPING;
        case '80':
            return EProxyStatus.STOPPED;
        default:
            return EProxyStatus.ERROR;
    }
}

export function convertToProxy(
    i: IAwsInstance,
    port: number,
    region: string
): IConnectorProxyRefreshed {
    const config: ITransportProxyRefreshedConfigDatacenter = {
        address: i.ipAddress && i.ipAddress.length > 0 ? {
            hostname: i.ipAddress[ 0 ],
            port,
        } : void 0,
    };
    const proxy: IConnectorProxyRefreshed = {
        type: CONNECTOR_AWS_TYPE,
        transportType: TRANSPORT_DATACENTER_TYPE,
        key: i.instanceId[ 0 ],
        name: i.instanceId[ 0 ],
        config,
        status: convertStatus(i.instanceState[ 0 ].code[ 0 ]),
        countryLike: convertRegionToCountryCode(region),
    };

    return proxy;
}
