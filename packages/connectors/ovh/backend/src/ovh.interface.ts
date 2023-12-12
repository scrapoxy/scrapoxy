import type {
    IOvhFlavorView,
    IOvhRegionView,
    IOvhSnapshotView,
} from '@scrapoxy/connector-ovh-sdk';


export interface IConnectorOvhCredential {
    appKey: string;
    appSecret: string;
    consumerKey: string;
}


export interface IConnectorOvhConfig {
    projectId: string;
    region: string;
    flavorId: string;
    port: number;
    snapshotId: string;
    tag: string;
}


//////////// PROJECTS ////////////
export enum EOvhProjectStatus {
    Ok = 'ok',
    Suspended = 'suspended',
}


export interface IOvhProject {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    project_id: string;
    description: string;
    status: EOvhProjectStatus;
}


//////////// REGIONS ////////////
export enum EOvhRegionStatus {
    UP = 'UP',
}


export interface IOvhRegion extends IOvhRegionView {
    status: EOvhRegionStatus;
    services: {
        name: string; // must have instance
    }[];
}


//////////// FLAVORS ////////////
export enum EOvhFlavorOsType {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    linux = 'linux',
}


export interface IOvhFlavor extends IOvhFlavorView {
    type: string;
    osType: EOvhFlavorOsType;
}


//////////// INSTANCES ////////////
export enum EOvhInstanceStatus {
    ACTIVE = 'ACTIVE',
    BUILD = 'BUILD',
    DELETED = 'DELETED',
    DELETING = 'DELETING',
    ERROR = 'ERROR',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    HARD_REBOOT = 'HARD_REBOOT', // Cold start
    SHUTOFF = 'SHUTOFF', // Stopped
    STOPPED = 'STOPPED',
    REBOOT = 'REBOOT', // Warm start
}


export enum EOvhVisibility {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public = 'public',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    private = 'private',
}


export interface IOvhInstance {
    id: string;
    name: string;
    region: string;
    ipAddresses: {
        ip: string;
        type: EOvhVisibility;
        version: number; // 4 or 6
    }[];
    status: EOvhInstanceStatus;
}


export interface IOvhCreateInstancesRequest {
    projectId: string;
    name: string;
    region: string;
    flavorId: string;
    imageId: string;
    userData?: string;
    count: number;
}


//////////// SNAPSHOTS ////////////
export enum EOvhSnapshotStatus {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    active = 'active',
}


export interface IOvhSnapshot extends IOvhSnapshotView {
    visibility: EOvhVisibility;
    status: EOvhSnapshotStatus;
}


//////////// IMAGES ////////////
export interface IOvhImage {
    id: string;
    name: string;
}


//////////// ERROR ////////////
export interface IOvhError {
    class: string;
    message: string;
}
