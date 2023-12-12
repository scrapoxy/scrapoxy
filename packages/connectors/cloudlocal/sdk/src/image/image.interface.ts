import type { ICertificate } from '@scrapoxy/common';


export enum EImageCloudlocalStatus {
    CREATING = 'creating',
    READY = 'ready',
}


export interface IImageCloudlocalToUpdate {
    certificate: ICertificate;
}


export interface IImageCloudlocalToCreate extends IImageCloudlocalToUpdate {
    id: string;
}


export interface IImageCloudlocalView {
    id: string;
    subscriptionId: string;
    region: string;
    status: EImageCloudlocalStatus;
}


export interface IImageCloudlocalData extends IImageCloudlocalView {
    certificate: ICertificate;
}


export interface IImageCloudlocalModel extends IImageCloudlocalData {
    lastRefreshTs: number;
}
