import type {
    IImageDatacenterLocalData,
    IImageDatacenterLocalView,
} from './image.interface';


export function toImageDatacenterLocalView(i: IImageDatacenterLocalView): IImageDatacenterLocalView {
    const image: IImageDatacenterLocalView = {
        id: i.id,
        subscriptionId: i.subscriptionId,
        region: i.region,
        status: i.status,
    };

    return image;
}


export function toImageDatacenterLocalData(i: IImageDatacenterLocalData): IImageDatacenterLocalData {
    const image: IImageDatacenterLocalData = {
        id: i.id,
        subscriptionId: i.subscriptionId,
        region: i.region,
        status: i.status,
        certificate: i.certificate,
    };

    return image;
}
