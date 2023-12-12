import { EDigitalOceanNetworkType } from './digitalocean.interface';
import type {
    IDigitalOceanDroplet,
    IDigitalOceanRegion,
    IDigitalOceanSize,
    IDigitalOceanSnapshot,
} from './digitalocean.interface';
import type {
    IDigitalOceanRegionView,
    IDigitalOceanSizeView,
    IDigitalOceanSnapshotView,
} from '@scrapoxy/connector-digitalocean-sdk';


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
