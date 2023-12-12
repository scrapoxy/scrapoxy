import type { IProxyIdToRemove } from '@scrapoxy/common';


export enum EInstanceCloudlocalStatus {
    STARTING = 'starting',
    STARTED = 'started',
    STOPPING = 'stopping',
    ERROR = 'error',
}


export interface IInstancesCloudlocalToCreate {
    ids: string[];
    imageId: string;
    size: string;
}


export interface IInstanceCloudlocalView {
    id: string;
    subscriptionId: string;
    region: string;
    imageId: string;
    size: string;
    status: EInstanceCloudlocalStatus;
    port: number | null;
}


export type IInstanceCloudlocalData = IInstanceCloudlocalView;


export interface IInstanceCloudlocalModel extends IInstanceCloudlocalData {
    proxy: any;
    lastRefreshTs: number;
    error: string | null;
}


export type IInstanceCloudlocalToRemove = IProxyIdToRemove;
