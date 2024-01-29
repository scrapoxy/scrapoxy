import type { ICertificate } from '../../../certificate';


export enum EImageDatacenterLocalStatus {
    CREATING = 'creating',
    READY = 'ready',
}


export interface IImageDatacenterLocalToUpdate {
    certificate: ICertificate;
}


export interface IImageDatacenterLocalToCreate extends IImageDatacenterLocalToUpdate {
    id: string;
}


export interface IImageDatacenterLocalView {
    id: string;
    subscriptionId: string;
    region: string;
    status: EImageDatacenterLocalStatus;
}


export interface IImageDatacenterLocalData extends IImageDatacenterLocalView {
    certificate: ICertificate;
}


export interface IImageDatacenterLocalModel extends IImageDatacenterLocalData {
    lastRefreshTs: number;
}
