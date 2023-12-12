import { EOvhVisibility } from './ovh.interface';
import type {
    IOvhFlavor,
    IOvhInstance,
    IOvhProject,
    IOvhSnapshot,
} from './ovh.interface';
import type {
    IOvhFlavorView,
    IOvhProjectView,
    IOvhRegionView,
    IOvhSnapshotView,
} from '@scrapoxy/connector-ovh-sdk';


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
