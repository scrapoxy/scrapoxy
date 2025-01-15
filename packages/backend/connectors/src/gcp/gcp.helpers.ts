import { TRANSPORT_DATACENTER_TYPE } from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_GCP_TYPE,
    EProxyStatus,
} from '@scrapoxy/common';
import { EGcpInstanceStatus } from './gcp.interface';
import type { IGcpInstance } from './gcp.interface';
import type { ITransportProxyRefreshedConfigDatacenter } from '@scrapoxy/backend-sdk';
import type { IConnectorProxyRefreshed } from '@scrapoxy/common';


const ZONE_PREFIX_TO_COUNTRY_CODE: Record<string, string> = {
    'africa-south-': 'za',
    'asia-east1-': 'tw',
    'asia-east2-': 'hk',
    'asia-northeast1-': 'jp',
    'asia-northeast2-': 'jp',
    'asia-northeast3-': 'kr',
    'asia-south1-': 'in',
    'asia-south2-': 'in',
    'asia-southeast1-': 'sg',
    'asia-southeast2-': 'id',
    'australia-': 'au',
    'europe-central2-': 'pl',
    'europe-north1-': 'fi',
    'europe-southwest1-': 'es',
    'europe-west1-': 'be',
    'europe-west10-': 'de',
    'europe-west12-': 'it',
    'europe-west2-': 'gb',
    'europe-west3-': 'de',
    'europe-west4-': 'nl',
    'europe-west6-': 'ch',
    'europe-west8-': 'it',
    'europe-west9-': 'fr',
    'me-central1-': 'qa',
    'me-central2-': 'sa',
    'me-west1-': 'il',
    'northamerica-northeast-': 'ca',
    'northamerica-south1-': 'mx',
    'southamerica-east1-': 'br',
    'southamerica-west1-': 'cl',
    'us-': 'us',
};


function convertZoneToCountryCode(zone: string | null | undefined): string | null {
    if (!zone) {
        return null;
    }

    for (const prefix in ZONE_PREFIX_TO_COUNTRY_CODE) {
        if (zone.startsWith(prefix)) {
            return ZONE_PREFIX_TO_COUNTRY_CODE[ prefix ];
        }
    }

    return null;
}


export function getGcpExternalIp(instance: IGcpInstance): string | undefined {
    if (!instance?.networkInterfaces ||
        instance.networkInterfaces.length <= 0) {
        return;
    }

    const networkInterface = instance.networkInterfaces[ 0 ];

    if (!networkInterface.accessConfigs ||
        networkInterface.accessConfigs.length <= 0) {
        return;
    }

    return networkInterface.accessConfigs[ 0 ].natIP;
}


function convertStatus(status: EGcpInstanceStatus): EProxyStatus {
    if (!status) {
        return EProxyStatus.ERROR;
    }

    switch (status) {
        case EGcpInstanceStatus.RUNNING:
            return EProxyStatus.STARTED;

        case EGcpInstanceStatus.PROVISIONING:
        case EGcpInstanceStatus.STAGING:
            return EProxyStatus.STARTING;

        case EGcpInstanceStatus.SUSPENDED:
        case EGcpInstanceStatus.TERMINATED:
            return EProxyStatus.STOPPED;

        case EGcpInstanceStatus.SUSPENDING:
        case EGcpInstanceStatus.STOPPING:
            return EProxyStatus.STOPPING;

        default:
            return EProxyStatus.ERROR;
    }
}


export function convertToProxy(
    instance: IGcpInstance,
    port: number,
    zone: string
): IConnectorProxyRefreshed {
    const hostname = getGcpExternalIp(instance);
    const config: ITransportProxyRefreshedConfigDatacenter = {
        address: hostname ? {
            hostname,
            port,
        } : void 0,
    };
    const proxy: IConnectorProxyRefreshed = {
        type: CONNECTOR_GCP_TYPE,
        transportType: TRANSPORT_DATACENTER_TYPE,
        key: instance.name as string,
        name: instance.name as string,
        config,
        status: convertStatus(instance.status),
        countryLike: convertZoneToCountryCode(zone),
    };

    return proxy;
}
