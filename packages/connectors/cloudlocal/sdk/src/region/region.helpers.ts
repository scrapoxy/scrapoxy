import type {
    IRegionCloudlocalModel,
    IRegionCloudlocalStore,
    IRegionSizeCloudlocal,
} from './region.interface';


export function fromRegionCloudlocalStore(r: IRegionCloudlocalStore): IRegionCloudlocalModel {
    const sizes = new Map<string, IRegionSizeCloudlocal>();
    for (const size of r.sizes) {
        sizes.set(
            size.id,
            size
        );
    }

    const region: IRegionCloudlocalModel = {
        id: r.id,
        description: r.description,
        sizes,
    };

    return region;
}
