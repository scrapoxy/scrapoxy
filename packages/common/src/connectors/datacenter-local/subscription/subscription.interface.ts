import type {
    IImageDatacenterLocalData,
    IImageDatacenterLocalModel,
} from '../image/image.interface';
import type { IInstanceDatacenterLocalModel } from '../instance/instance.interface';


export interface ISubscriptionDatacenterLocalToUpdate {
    instancesLimit: number;
    installDelay: number;
    startingDelay: number;
    stoppingDelay: number;
    transitionStartingToStarted: boolean;
    transitionStoppingToStopped: boolean;
}


export interface ISubscriptionDatacenterLocalToCreate extends ISubscriptionDatacenterLocalToUpdate {
    id: string;
}


export interface ISubscriptionDatacenterLocalView {
    id: string;
}


export interface ISubscriptionDatacenterLocalData extends ISubscriptionDatacenterLocalToCreate {
    removeForcedCount: number;
}


export interface ISubscriptionRegionDatacenterLocalModel {
    id: string;
    images: Map<string, IImageDatacenterLocalModel>;
    instances: Map<string, IInstanceDatacenterLocalModel>;
}


export interface ISubscriptionDatacenterLocalModel extends ISubscriptionDatacenterLocalData {
    regions: Map<string, ISubscriptionRegionDatacenterLocalModel>;
}


export interface ISubscriptionDatacenterLocalStore extends ISubscriptionDatacenterLocalData {
    images: IImageDatacenterLocalData[];
}
