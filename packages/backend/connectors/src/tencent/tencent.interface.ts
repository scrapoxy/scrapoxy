export interface IConnectorTencentCredential {
    secretId: string;
    secretKey: string;
}


export interface IConnectorTencentConfig {
    region: string;
    zone: string;
    port: number;
    instanceType: string;
    imageId: string;
    tag: string;
    projectId: number;
}


export interface ITencentError {
    class: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Message: string;
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

export interface ITencentDescribeInstancesRequest {
    instancesIds?: string[];
    zones?: string[];
    group?: string;
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

export interface ITencentRunInstancesRequest {
    imageId: string;
    instanceType: string;
    count: number;
    instanceName: string;
    zone: string;
    projectId?: number;
    userData?: string;
    terminateOnShutdown?: boolean;
    group?: string;
    
}

//////////// IMAGES ////////////
export interface ITencentDescribeImagesRequest {
    platform?: string;
    imageType?: string;
    imageId?: string;
    name?: string;
    instanceType?: string;
}

export enum ETencentImageState {
    CREATING = 'CREATING',
    NORMAL = 'NORMAL',
    USING = 'USING',
    FAILED = 'FAILED',
    DELETING = 'DELETING',
    DELETED = 'DELETED',
}

export interface ITencentImage {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    ImageId: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    ImageState: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    CreatedTime: string;
}
