import type {
    IImageCloudlocalData,
    IImageCloudlocalView,
} from './image.interface';


export function toImageCloudlocalView(i: IImageCloudlocalView): IImageCloudlocalView {
    const image: IImageCloudlocalView = {
        id: i.id,
        subscriptionId: i.subscriptionId,
        region: i.region,
        status: i.status,
    };

    return image;
}


export function toImageCloudlocalData(i: IImageCloudlocalData): IImageCloudlocalData {
    const image: IImageCloudlocalData = {
        id: i.id,
        subscriptionId: i.subscriptionId,
        region: i.region,
        status: i.status,
        certificate: i.certificate,
    };

    return image;
}
