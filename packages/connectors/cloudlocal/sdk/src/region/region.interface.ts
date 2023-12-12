export interface IRegionCloudlocal {
    id: string;
    description: string;
}


export interface IRegionCloudlocalModel extends IRegionCloudlocal {
    sizes: Map<string, IRegionSizeCloudlocal>;
}


export interface IRegionCloudlocalStore extends IRegionCloudlocal{
    sizes: IRegionSizeCloudlocal[];
}


export interface IRegionSizeCloudlocal {
    id: string;
    description: string;
    vcpus: number;
    memory: number;
}


export interface ICloudlocalQueryRegionSizes {
    region: string;
}
