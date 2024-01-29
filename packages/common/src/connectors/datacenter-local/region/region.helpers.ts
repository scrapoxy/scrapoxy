import type {
    IRegionDatacenterLocalModel,
    IRegionDatacenterLocalStore,
    IRegionSizeDatacenterLocal,
} from './region.interface';


export function fromRegionDatacenterLocalStore(r: IRegionDatacenterLocalStore): IRegionDatacenterLocalModel {
    const sizes = new Map<string, IRegionSizeDatacenterLocal>();
    for (const size of r.sizes) {
        sizes.set(
            size.id,
            size
        );
    }

    const region: IRegionDatacenterLocalModel = {
        id: r.id,
        description: r.description,
        sizes,
    };

    return region;
}
