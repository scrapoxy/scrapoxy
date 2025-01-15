import { TRANSPORT_DATACENTER_TYPE } from '@scrapoxy/backend-sdk';
import {
    CONNECTOR_DIGITALOCEAN_TYPE,
    EProxyStatus,
} from '@scrapoxy/common';
import {
    EDigitalOceanDropletStatus,
    EDigitalOceanNetworkType,
} from './digitalocean.interface';
import type {
    IDigitalOceanDroplet,
    IDigitalOceanRegion,
    IDigitalOceanSize,
    IDigitalOceanSnapshot,
} from './digitalocean.interface';
import type { ITransportProxyRefreshedConfigDatacenter } from '@scrapoxy/backend-sdk';
import type {
    IConnectorProxyRefreshed,
    IDigitalOceanRegionView,
    IDigitalOceanSizeView,
    IDigitalOceanSnapshotView,
} from '@scrapoxy/common';


const REGION_PREFIX_TO_COUNTRY_CODE: Record<string, string> = {
    nyc: 'us',
    sfo: 'us',
    ams: 'nl',
    sgp: 'sg',
    lon: 'uk',
    fra: 'de',
    tor: 'ca',
    blr: 'in',
    syd: 'au',
};


function convertRegionToCountryCode(region: string | null | undefined): string | null {
    if (!region) {
        return null;
    }

    const prefix = region.substring(
        0,
        3
    );

    return REGION_PREFIX_TO_COUNTRY_CODE[ prefix ] ?? null;
}


export function getDigitalOceanPublicAddress(droplet: IDigitalOceanDroplet): string | undefined {
    for (const network of droplet.networks.v4) {
        if (network.type === EDigitalOceanNetworkType.PUBLIC) {
            return network.ip_address;
        }
    }

    return;
}


export function toDigitalOceanRegionView(region: IDigitalOceanRegion): IDigitalOceanRegionView {
    const r: IDigitalOceanRegionView = {
        slug: region.slug,
        name: region.name,
    };

    return r;
}


export function toDigitalOceanSizeView(size: IDigitalOceanSize): IDigitalOceanSizeView {
    const s: IDigitalOceanSizeView = {
        slug: size.slug,
        description: size.description,
        vcpus: size.vcpus,
        memory: size.memory,
    };

    return s;
}


export function toDigitalOceanSnapshotView(snapshot: IDigitalOceanSnapshot): IDigitalOceanSnapshotView {
    const s: IDigitalOceanSnapshotView = {
        id: snapshot.id,
        name: snapshot.name,
    };

    return s;
}


function convertStatus(status: EDigitalOceanDropletStatus): EProxyStatus {
    if (!status) {
        return EProxyStatus.ERROR;
    }

    switch (status) {
        case EDigitalOceanDropletStatus.NEW:
            return EProxyStatus.STARTING;
        case EDigitalOceanDropletStatus.ACTIVE:
            return EProxyStatus.STARTED;
        case EDigitalOceanDropletStatus.OFF:
            return EProxyStatus.STOPPED;
        default:
            return EProxyStatus.ERROR;
    }
}


export function convertToProxy(
    droplet: IDigitalOceanDroplet, port: number
): IConnectorProxyRefreshed {
    const hostname = getDigitalOceanPublicAddress(droplet);
    const config: ITransportProxyRefreshedConfigDatacenter = {
        address: hostname ? {
            hostname,
            port,
        } : void 0,
    };
    const proxy: IConnectorProxyRefreshed = {
        type: CONNECTOR_DIGITALOCEAN_TYPE,
        transportType: TRANSPORT_DATACENTER_TYPE,
        key: droplet.id.toString(10),
        name: droplet.name,
        config,
        status: convertStatus(droplet.status),
        countryLike: convertRegionToCountryCode(droplet.region.slug),
    };

    return proxy;
}
