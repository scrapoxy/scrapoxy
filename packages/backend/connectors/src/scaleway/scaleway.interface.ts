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

export enum EScalewayRegions {
    PAR1 = 'fr-par-1',
    PAR2 = 'fr-par-2',
    PAR3 = 'fr-par-3',
    AMS1 = 'nl-ams-1',
    AMS2 = 'nl-ams-2',
    AMS3 = 'nl-ams-3',
    WAW1 = 'pl-waw-1',
    WAW2 = 'pl-waw-2',
    WAW3 = 'pl-waw-3'
}

export interface IScalewayError {
    class: string;
    message: string;
}

export interface IScalewayVolume {
    size: number,
    volume_type: string
}

export type IScalewayExtraVolume = IScalewayVolume & {
    id: string,
    state: string
}

export interface IScalewayVolumes<T extends IScalewayVolume> {
    [index:string]:T
}

export enum EScalewayInstanceState {
    STARTING = 'starting',
    RUNNING = 'running',
    STOPPING = 'stopping',
    STOPPED = 'stopped',
    LOCKED = 'locked',
    STOPPED_IN_PLACE = 'stopped in place',

}

export interface IScalewayIP {
    id: string,
    address: string
}

export interface IScalewayInstanceBase {
    name: string,
    project: string,
    commercial_type: string,
    public_ips?: IScalewayIP[]
    tags: string[]
}

export interface IScalewayInstance extends IScalewayInstanceBase {
    id: string,
    volumes: IScalewayVolumes<IScalewayExtraVolume>,
    state: EScalewayInstanceState,
    image: IScalewayImage,
    arch: string
}

export interface IScalewayCreateInstancesRequest extends IScalewayInstanceBase{
    image: string,
    volumes?: IScalewayVolumes<IScalewayVolume>
}

export interface IScalewayInfo {
    secret_key: string,
    region: string,
    project_id: string
}

export enum EScalewaySnapshotState {
    AVAILABLE = 'available',
    SNAPSHOTTING = 'snapshotting',
    ERROR = 'error',
    INVALID = 'invalid_data',
    IMPORTING = 'importing',
    EXPORTING = 'exporting'
}

export interface IScalewaySnapshot {
    id: string;
    base_volume: {
        volume_id: string,
        volume_name: string
    },
    state: EScalewaySnapshotState
}

export enum EScalewayImageState {
    AVAILABLE = 'available',
    CREATING = 'creating',
    ERROR = 'error',
}

export interface IScalewayImage {
    id: string,
    arch: string,
    state: EScalewayImageState
}

export interface IScalewaySecurityRuleRequest {
    protocol: "unknown_protocol" | "TCP" | "UDP" | "ICMP" | "ANY",
    direction: "unknown_direction" | "inbound" | "outbound",
    action: "unknown_action" | "accept" | "drop",
    ip_range: string,
    position: number,
    editable: boolean,
    dest_port_from?: number,
    dest_port_to?: number,
    project: string
}

export interface IScalewaySecurityRule extends IScalewaySecurityRuleRequest {
    id: string,
    zone: string
}