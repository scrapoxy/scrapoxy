export enum EOvhQueryCredential {
    Projects = 'projects',
    Regions = 'regions',
    Flavors = 'flavors',
    Snapshots = 'snapshots',
}


//////////// PROJECTS ////////////
export interface IOvhProjectView {
    id: string;
    name: string;
}


//////////// REGIONS ////////////
export interface IOvhRegionView {
    name: string;
    continentCode: string;
    datacenterLocation: string;
}


export interface IOvhQueryRegions {
    projectId: string;
}


//////////// FLAVORS ////////////
export interface IOvhFlavorView {
    id: string;
    name: string;
    ram: number;
    vcpus: number;
}


export interface IOvhQueryFlavors {
    projectId: string;
    region: string;
}


//////////// SNAPSHOTS ////////////
export interface IOvhSnapshotView {
    id: string;
    name: string;
}


export type IOvhQuerySnapshots = IOvhQueryFlavors;
