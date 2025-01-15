import {
    CONNECTOR_DATACENTER_LOCAL_TYPE,
    EInstanceDatacenterLocalStatus,
    EProxyStatus,
} from '@scrapoxy/common';
import { TRANSPORT_DATACENTER_LOCAL_TYPE } from './transport/datacenter-local.constants';
import type { ITransportProxyRefreshedConfigDatacenter } from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IInstanceDatacenterLocalView,
} from '@scrapoxy/common';


const REGION_TO_COUNTRY: Record<string, string> = {
    europe: 'fr',
    asia: 'jp',
    america: 'us',
    australia: 'au',
};


function convertRegion(region: string | null | undefined): string | null {
    if (!region) {
        return null;
    }

    return REGION_TO_COUNTRY[ region ] ?? null;
}


function convertStatus(status: EInstanceDatacenterLocalStatus): EProxyStatus {
    if (!status) {
        return EProxyStatus.ERROR;
    }

    switch (status) {
        case EInstanceDatacenterLocalStatus.STARTING: {
            return EProxyStatus.STARTING;
        }

        case EInstanceDatacenterLocalStatus.STARTED: {
            return EProxyStatus.STARTED;
        }

        case EInstanceDatacenterLocalStatus.STOPPING: {
            return EProxyStatus.STOPPING;
        }

        default: {
            return EProxyStatus.ERROR;
        }
    }
}


export function convertToProxy(instance: IInstanceDatacenterLocalView): IConnectorProxyRefreshed {
    const config: ITransportProxyRefreshedConfigDatacenter = {
        address: instance.port ? {
            hostname: 'localhost',
            port: instance.port,
        } : void 0,
    };
    const proxy: IConnectorProxyRefreshed = {
        type: CONNECTOR_DATACENTER_LOCAL_TYPE,
        transportType: TRANSPORT_DATACENTER_LOCAL_TYPE,
        key: instance.id,
        name: instance.id,
        config,
        status: convertStatus(instance.status),
        countryLike: convertRegion(instance.region),
    };

    return proxy;
}
