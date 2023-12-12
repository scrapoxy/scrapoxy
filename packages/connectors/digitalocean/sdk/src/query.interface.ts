export enum EDigitalOceanQueryCredential {
    Regions = 'regions',
    Sizes = 'sizes',
    Snapshots = 'snapshots',
}


//////////// REGIONS ////////////
export interface IDigitalOceanRegionView {
    slug: string;
    name: string;
}


//////////// SIZES ////////////
export interface IDigitalOceanSizeView {
    slug: string;
    description: string;
    vcpus: number;
    memory: number;
}


export interface IDigitalOceanQuerySizes {
    region: string;
}


//////////// SNAPSHOTS ////////////
export interface IDigitalOceanSnapshotView {
    id: number;
    name: string;
}


export type IDigitalOceanQuerySnapshots = IDigitalOceanQuerySizes;
