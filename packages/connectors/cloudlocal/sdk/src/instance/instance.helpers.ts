import { EProxyStatus } from '@scrapoxy/common';
import { EInstanceCloudlocalStatus } from './instance.interface';
import type {
    IInstanceCloudlocalData,
    IInstanceCloudlocalView,
} from './instance.interface';


export function toInstanceCloudlocalView(i: IInstanceCloudlocalView): IInstanceCloudlocalView {
    const instance: IInstanceCloudlocalView = {
        id: i.id,
        subscriptionId: i.subscriptionId,
        region: i.region,
        imageId: i.imageId,
        size: i.size,
        status: i.status,
        port: i.port,
    };

    return instance;
}


export function toInstanceCloudlocalData(i: IInstanceCloudlocalData): IInstanceCloudlocalData {
    return toInstanceCloudlocalView(i);
}


export function convertProxyStatus(status: EProxyStatus): EInstanceCloudlocalStatus {
    if (!status) {
        return EInstanceCloudlocalStatus.ERROR;
    }

    switch (status) {
        case EProxyStatus.STARTING: {
            return EInstanceCloudlocalStatus.STARTING;
        }

        case EProxyStatus.STARTED: {
            return EInstanceCloudlocalStatus.STARTED;
        }

        case EProxyStatus.STOPPING: {
            return EInstanceCloudlocalStatus.STOPPING;
        }

        case EProxyStatus.STOPPED: {
            throw new Error('Proxy status STOPPED not supported');
        }

        default: {
            return EInstanceCloudlocalStatus.ERROR;
        }
    }
}


export function convertInstanceStatus(status: EInstanceCloudlocalStatus): EProxyStatus {
    if (!status) {
        return EProxyStatus.ERROR;
    }

    switch (status) {
        case EInstanceCloudlocalStatus.STARTING: {
            return EProxyStatus.STARTING;
        }

        case EInstanceCloudlocalStatus.STARTED: {
            return EProxyStatus.STARTED;
        }

        case EInstanceCloudlocalStatus.STOPPING: {
            return EProxyStatus.STOPPING;
        }

        default: {
            return EProxyStatus.ERROR;
        }
    }
}
