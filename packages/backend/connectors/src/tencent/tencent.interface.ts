export interface IConnectorTencentCredential {
    secretId: string;
    secretKey: string;
}


export interface IConnectorTencentConfig {
    region: string;
    zone: string;
    port: number;
    instanceType: string;
    projectId: string;
    tag: string;
}


//////////// REGIONS ////////////
export interface ITencentDescribeRegionsResponse {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    RegionSet: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Region: string;
    }[];
}


//////////// ZONES ////////////
export interface ITencentDescribeZonesResponse {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    ZoneSet: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Zone: string;
    }[];
}


//////////// INSTANCES ////////////
export enum ETencentInstanceState {
    PENDING = 'PENDING',
    STARTING = 'STARTING',
    RUNNING = 'RUNNING',
    STOPPING = 'STOPPING',
    STOPPED = 'STOPPED',
    REBOOTING = 'REBOOTING',
}


export interface ITencentInstance {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    InstanceName: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    InstanceId: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    InstanceState: ETencentInstanceState;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    InstanceType: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    PublicIpAddresses?: string[];
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Tags: string[];
}


export interface ITencentDescribeInstancesRequest {
    instancesIds?: string[];
    zones?: string[];
    group?: string;
}


export interface ITencentDescribeInstancesResponse {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    InstanceSet: ITencentInstance[];
}


export interface ITencentRunInstancesRequest {
    imageId: string;
    instanceType: string;
    count: number;
    instanceName: string;
    zone: string;
    projectId?: number;
    userData: string;
    terminateOnShutdown?: boolean;
    group?: string;
}


export interface ITencentRunInstancesResponse {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    InstanceIdSet: string[];
}


//////////// INSTANCE TYPES ////////////
export interface ITencentDescribeInstanceTypeConfigsResponse {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    InstanceTypeConfigSet: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        InstanceType: string;
    }[];
}


export interface ITencentImage {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    ImageId: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    ImageState: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    CreatedTime: string;
}


export interface ITencentDescribeImagesRequest {
    platform?: string;
    imageType?: string;
    imageId?: string;
    name?: string;
    instanceType?: string;
}

export interface ITencentDescribeImagesResponse {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    ImageSet: ITencentImage[];
}
