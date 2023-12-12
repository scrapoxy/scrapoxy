import type {
    IImageCloudlocalData,
    IImageCloudlocalModel,
} from '../image/image.interface';
import type { IInstanceCloudlocalModel } from '../instance/instance.interface';


export interface ISubscriptionCloudlocalToUpdate {
    instancesLimit: number;
    installDelay: number;
    startingDelay: number;
    stoppingDelay: number;
    transitionStartingToStarted: boolean;
    transitionStoppingToStopped: boolean;
}


export interface ISubscriptionCloudlocalToCreate extends ISubscriptionCloudlocalToUpdate {
    id: string;
}


export interface ISubscriptionCloudlocalView {
    id: string;
}


export interface ISubscriptionCloudlocalData extends ISubscriptionCloudlocalToCreate {
    removeForcedCount: number;
}


export interface ISubscriptionRegionCloudlocalModel {
    id: string;
    images: Map<string, IImageCloudlocalModel>;
    instances: Map<string, IInstanceCloudlocalModel>;
}


export interface ISubscriptionCloudlocalModel extends ISubscriptionCloudlocalData {
    regions: Map<string, ISubscriptionRegionCloudlocalModel>;
}


export interface ISubscriptionCloudlocalStore extends ISubscriptionCloudlocalData {
    images: IImageCloudlocalData[];
}
