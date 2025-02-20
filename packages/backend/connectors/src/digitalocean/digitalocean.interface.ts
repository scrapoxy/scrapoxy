import type {
    IDigitalOceanRegionView,
    IDigitalOceanSizeView,
} from '@scrapoxy/common';


export interface IConnectorDigitalOceanCredential {
    token: string;
}


export interface IConnectorDigitalOceanConfig {
    region: string;
    port: number;
    size: string;
    tag: string;
}


//////////// ACCOUNT ////////////
export enum EDigitalOceanAccountStatus {
    ACTIVE = 'active',
}


export interface IDigitalOceanAccount {
    email: string;
    uuid: string;
    status: EDigitalOceanAccountStatus;
}


export interface IDigitalOceanAccountResponse {
    account: IDigitalOceanAccount;
}


//////////// REGIONS ////////////
export interface IDigitalOceanRegion extends IDigitalOceanRegionView{
    available: boolean;
}


export interface IDigitalOceanRegionsResponse {
    regions: IDigitalOceanRegion[];
}


//////////// SIZES ////////////
export interface IDigitalOceanSize extends IDigitalOceanSizeView {
    available: true;
    regions: string[];
}


export interface IDigitalOceanSizesResponse {
    sizes: IDigitalOceanSize[];
}


//////////// DROPLETS ////////////
export enum EDigitalOceanNetworkType {
    PUBLIC = 'public',
}


export interface IDigitalOceanNetworksV4 {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    ip_address: string;
    type: EDigitalOceanNetworkType;
}


export interface IDigitalOceanNetworks {
    v4: IDigitalOceanNetworksV4[];
}


export enum EDigitalOceanDropletStatus {
    OFF = 'off',
    ACTIVE = 'active',
    NEW = 'new',
    ARCHIVE = 'archive',
}


export interface IDigitalOceanDroplet {
    id: number;
    name: string;
    status: EDigitalOceanDropletStatus;
    region: IDigitalOceanRegion;
    networks: IDigitalOceanNetworks;
    tags: string[];
}


export interface IDigitalOceanCreateDropletsRequest {
    names: string[];
    region: string;
    size: string;
    imageName: string;
    tags: string[];
    userData: string;
}


export interface IDigitalOceanDropletsResponse {
    droplets: IDigitalOceanDroplet[];
}


//////////// ACTIONS ////////////
export enum EDigitalOceanActionStatus {
    INPROGRESS = 'in-progress',
}


export interface IDigitalOceanAction {
    id: number;
    status: EDigitalOceanActionStatus;
}


export interface IDigitalOceanActionResponse {
    action: IDigitalOceanAction;
}


//////////// ERROR ////////////
export interface IDigitalOceanError {
    id: string;
    message: string;
}
