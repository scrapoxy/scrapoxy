import { TRANSPORT_DATACENTER_TYPE } from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_OVH_TYPE,
    EProxyStatus,
} from '@scrapoxy/common';
import {
    EOvhInstanceStatus,
    EOvhVisibility,
} from './ovh.interface';
import type {
    IOvhFlavor,
    IOvhInstance,
    IOvhProject,
    IOvhSnapshot,
} from './ovh.interface';
import type { ITransportProxyRefreshedConfigDatacenter } from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IOvhFlavorView,
    IOvhProjectView,
    IOvhRegionView,
    IOvhSnapshotView,
} from '@scrapoxy/common';


export function getOvhExternalIp(instance: IOvhInstance): string | undefined {
    const address = instance.ipAddresses.find((ip) => ip.type === EOvhVisibility.public && ip.version === 4);

    if (!address) {
        return;
    }

    return address.ip;
}


export function toOvhProjectView(project: IOvhProject): IOvhProjectView {
    const p: IOvhProjectView = {
        id: project.project_id,
        name: project.description,
    };

    return p;
}


export function toOvhRegionView(region: IOvhRegionView): IOvhRegionView {
    const r: IOvhRegionView = {
        name: region.name,
        continentCode: region.continentCode,
        datacenterLocation: region.datacenterLocation,
    };

    return r;
}


export function toOvhFlavorView(flavor: IOvhFlavor): IOvhFlavorView {
    const f: IOvhFlavorView = {
        id: flavor.id,
        name: flavor.name,
        ram: flavor.ram,
        vcpus: flavor.vcpus,
    };

    return f;
}


export function toOvhSnapshotView(snapshot: IOvhSnapshot): IOvhSnapshotView {
    const s: IOvhSnapshotView = {
        id: snapshot.id,
        name: snapshot.name,
    };

    return s;
}


const REGION_PREFIX_TO_COUNTRY_CODE: Record<string, string> = {
    BHS: 'ca',
    'CA-EAST-TOR': 'ca',
    DE: 'de',
    GRA: 'fr',
    RBX: 'fr',
    SBG: 'fr',
    UK: 'uk',
    WAW: 'pl',
};


function convertRegionToCountryCode(region: string | null | undefined): string | null {
    if (!region) {
        return null;
    }

    for (const prefix in REGION_PREFIX_TO_COUNTRY_CODE) {
        if (region.startsWith(prefix)) {
            return REGION_PREFIX_TO_COUNTRY_CODE[ prefix ];
        }
    }

    return null;
}


function convertStatus(status: EOvhInstanceStatus): EProxyStatus {
    if (!status) {
        return EProxyStatus.ERROR;
    }

    switch (status) {
        case EOvhInstanceStatus.ACTIVE:
            return EProxyStatus.STARTED;

        case EOvhInstanceStatus.BUILD:
        case EOvhInstanceStatus.REBOOT:
        case EOvhInstanceStatus.HARD_REBOOT:
            return EProxyStatus.STARTING;

        case EOvhInstanceStatus.STOPPED:
        case EOvhInstanceStatus.SHUTOFF:
            return EProxyStatus.STOPPED;

        case EOvhInstanceStatus.DELETING:
            return EProxyStatus.STOPPING;

        default:
            return EProxyStatus.ERROR;
    }
}


export function convertToProxy(
    instance: IOvhInstance,
    port: number,
    region: string
): IConnectorProxyRefreshed {
    const hostname = getOvhExternalIp(instance);
    const config: ITransportProxyRefreshedConfigDatacenter = {
        address: hostname ? {
            hostname,
            port,
        } : void 0,
    };
    const proxy: IConnectorProxyRefreshed = {
        type: CONNECTOR_OVH_TYPE,
        transportType: TRANSPORT_DATACENTER_TYPE,
        key: instance.id,
        name: instance.name,
        config,
        status: convertStatus(instance.status),
        removingForceCap: false,
        countryLike: convertRegionToCountryCode(region),
    };

    return proxy;
}
