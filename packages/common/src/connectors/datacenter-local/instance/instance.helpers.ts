import { EInstanceDatacenterLocalStatus } from './instance.interface';
import { EProxyStatus } from '../../../proxies';
import type {
    IInstanceDatacenterLocalData,
    IInstanceDatacenterLocalView,
} from './instance.interface';


export function toInstanceDatacenterLocalView(i: IInstanceDatacenterLocalView): IInstanceDatacenterLocalView {
    const instance: IInstanceDatacenterLocalView = {
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


export function toInstanceDatacenterLocalData(i: IInstanceDatacenterLocalData): IInstanceDatacenterLocalData {
    return toInstanceDatacenterLocalView(i);
}


export function convertProxyStatus(status: EProxyStatus): EInstanceDatacenterLocalStatus {
    if (!status) {
        return EInstanceDatacenterLocalStatus.ERROR;
    }

    switch (status) {
        case EProxyStatus.STARTING: {
            return EInstanceDatacenterLocalStatus.STARTING;
        }

        case EProxyStatus.STARTED: {
            return EInstanceDatacenterLocalStatus.STARTED;
        }

        case EProxyStatus.STOPPING: {
            return EInstanceDatacenterLocalStatus.STOPPING;
        }

        case EProxyStatus.STOPPED: {
            throw new Error('Proxy status STOPPED not supported');
        }

        default: {
            return EInstanceDatacenterLocalStatus.ERROR;
        }
    }
}


export function convertInstanceStatus(status: EInstanceDatacenterLocalStatus): EProxyStatus {
    if (!status) {
        return EProxyStatus.ERROR;
    }

    switch (status) {
        case EInstanceDatacenterLocalStatus.STARTING: {
            return EProxyStatus.STARTING;
        }

        case EInstanceDatacenterLocalStatus.STARTED: {
            return EProxyStatus.STARTED;
        }

        case EInstanceDatacenterLocalStatus.STOPPING: {
            return EProxyStatus.STOPPING;
        }

        default: {
            return EProxyStatus.ERROR;
        }
    }
}
