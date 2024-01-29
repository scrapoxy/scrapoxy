export interface IRegionDatacenterLocal {
    id: string;
    description: string;
}


export interface IRegionDatacenterLocalModel extends IRegionDatacenterLocal {
    sizes: Map<string, IRegionSizeDatacenterLocal>;
}


export interface IRegionDatacenterLocalStore extends IRegionDatacenterLocal{
    sizes: IRegionSizeDatacenterLocal[];
}


export interface IRegionSizeDatacenterLocal {
    id: string;
    description: string;
    vcpus: number;
    memory: number;
}


export interface IDatacenterLocalQueryRegionSizes {
    region: string;
}
