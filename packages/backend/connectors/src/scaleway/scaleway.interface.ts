export interface IConnectorScalewayCredential {
    secretAccessKey: string;
    projectId: string;
}


export interface IConnectorScalewayConfig {
    region: string;
    port: number;
    instanceType: string;
    snapshotId: string;
    imageId: string;
    tag: string;
}


export interface IScalewayError {
    class: string;
    message: string;
}


//////////// REGIONS ////////////
export enum EScalewayRegions {
    PAR1 = 'fr-par-1',
    PAR2 = 'fr-par-2',
    PAR3 = 'fr-par-3',
    AMS1 = 'nl-ams-1',
    AMS2 = 'nl-ams-2',
    AMS3 = 'nl-ams-3',
    WAW1 = 'pl-waw-1',
    WAW2 = 'pl-waw-2',
    WAW3 = 'pl-waw-3',
}


//////////// VOLUMES ////////////
export interface IScalewayVolume {
    size: number;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    volume_type: string;
}


export interface IScalewayExtraVolume extends IScalewayVolume {
    id: string;
    state: string;
}


export interface IScalewayVolumes<T extends IScalewayVolume> {
    [index: string]: T;
}


//////////// NETWORK ////////////
export interface IScalewayIP {
    id: string;
    address: string;
}


export interface IScalewaySecurityRuleRequest {
    protocol: 'unknown_protocol' | 'TCP' | 'UDP' | 'ICMP' | 'ANY';
    direction: 'unknown_direction' | 'inbound' | 'outbound';
    action: 'unknown_action' | 'accept' | 'drop';
    // eslint-disable-next-line @typescript-eslint/naming-convention
    ip_range: string;
    position: number;
    editable: boolean;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    dest_port_from?: number;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    dest_port_to?: number;
    project: string;
}


export interface IScalewaySecurityRule extends IScalewaySecurityRuleRequest {
    id: string;
    zone: string;
}


//////////// INSTANCES ////////////
export enum EScalewayInstanceState {
    STARTING = 'starting',
    RUNNING = 'running',
    STOPPING = 'stopping',
    STOPPED = 'stopped',
    LOCKED = 'locked',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    STOPPED_IN_PLACE = 'stopped in place',

}


export interface IScalewayInstanceBase {
    name: string;
    project: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    commercial_type: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public_ips?: IScalewayIP[];
    tags: string[];
}


export interface IScalewayInstance extends IScalewayInstanceBase {
    id: string;
    volumes: IScalewayVolumes<IScalewayExtraVolume>;
    state: EScalewayInstanceState;
    image: IScalewayImage;
    arch: string;
}


export interface IScalewayCreateInstancesRequest extends IScalewayInstanceBase {
    image: string;
    volumes?: IScalewayVolumes<IScalewayVolume>;
}


//////////// SNAPSHOTS ////////////
export enum EScalewaySnapshotState {
    AVAILABLE = 'available',
    SNAPSHOTTING = 'snapshotting',
    ERROR = 'error',
    INVALID = 'invalid_data',
    IMPORTING = 'importing',
    EXPORTING = 'exporting',
}


export interface IScalewaySnapshot {
    id: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    base_volume: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        volume_id: string;
        // eslint-disable-next-line @typescript-eslint/naming-convention
        volume_name: string;
    };
    state: EScalewaySnapshotState;
}


//////////// IMAGES ////////////
export enum EScalewayImageState {
    AVAILABLE = 'available',
    CREATING = 'creating',
    ERROR = 'error',
}


export interface IScalewayImage {
    id: string;
    arch: string;
    state: EScalewayImageState;
}
