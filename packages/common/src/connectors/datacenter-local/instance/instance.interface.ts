import type { IProxyIdToRemove } from '../../../proxies';


export enum EInstanceDatacenterLocalStatus {
    STARTING = 'starting',
    STARTED = 'started',
    STOPPING = 'stopping',
    ERROR = 'error',
}


export interface IInstancesDatacenterLocalToCreate {
    ids: string[];
    imageId: string;
    size: string;
}


export interface IInstanceDatacenterLocalView {
    id: string;
    subscriptionId: string;
    region: string;
    imageId: string;
    size: string;
    status: EInstanceDatacenterLocalStatus;
    port: number | null;
}


export type IInstanceDatacenterLocalData = IInstanceDatacenterLocalView;


export interface IInstanceDatacenterLocalModel extends IInstanceDatacenterLocalData {
    proxy: any;
    lastRefreshTs: number;
    error: string | null;
}


export type IInstanceDatacenterLocalToRemove = IProxyIdToRemove;
