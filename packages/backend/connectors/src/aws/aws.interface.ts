export interface IConnectorAwsCredential {
    accessKeyId: string;
    secretAccessKey: string;
}


export interface IConnectorAwsConfig {
    region: string;
    port: number;
    instanceType: string;
    securityGroupName: string;
    tag: string;
}


//////////// REGIONS ////////////
export interface IAwsRegion {
    regionName: string[];
}


export interface IAwsDescribeRegionsResponse {
    regionInfo: ({
        item: IAwsRegion[];
    } | undefined)[];
}


//////////// INSTANCES TYPES ////////////
export interface IAwsInstanceType {
    instanceType: string[];
    processorInfo: {
        supportedArchitectures: ({
            item: string[];
        } | undefined)[];
    }[];
}


export interface IAwsDescribeInstancesTypesResponse {
    instanceTypeSet: ({
        item: IAwsInstanceType[];
    } | undefined)[];
}


//////////// SECURITY GROUP ////////////
export interface IAwsCreateSecurityGroupResponse {
    groupId: string;
}


export interface IAwsAuthorizeSecurityGroupIngressPermission {
    fromPort: number;
    toPort: number;
    protocol: string;
    cidrIp: string;
}


//////////// INSTANCES ////////////
export interface IAwsDescribeInstancesRequest {
    instancesIds?: string[];
    statesCodes?: string[];
    group?: string;
}


export interface IAwsInstance {
    instanceId: string[];
    instanceState: {
        code: string[];
    }[];
    ipAddress?: string[];
}


export interface IAwsReservationSet {
    instancesSet: ({
        item: IAwsInstance[];
    } | undefined)[];
}


export interface IAwsDescribeInstancesResponse {
    reservationSet: ({
        item: IAwsReservationSet[];
    } | undefined)[];
}


export interface IAwsDescribeRunInstancesRequest {
    imageId: string;
    instanceType: string;
    count: number;
    securityGroup: string;
    userData?: string;
    terminateOnShutdown: boolean;
    group?: string;
}


export interface IAwsDescribeRunInstancesResponse {
    instancesSet: ({
        item: IAwsInstance[];
    } | undefined)[];
}


export interface IAwsBlockDeviceMapping {
    ebs?: {
        snapshotId: string[];
    }[];
}


//////////// IMAGES ////////////
export interface IAwsDescribeImagesRequest {
    architecture?: string;
    imageType?: string;
    isPublic?: boolean;
    name?: string;
    ownerAlias?: string;
    state?: string;
    virtualizationType?: string;
}


export interface IAwsImage {
    imageId: string[];
    imageState: string[];
    blockDeviceMapping: ({
        item: IAwsBlockDeviceMapping[];
    } | undefined)[];
    creationDate: string[];
}


export interface IAwsDescribeImagesResponse {
    imagesSet: ({
        item: IAwsImage[];
    } | undefined)[];
}


//////////// ERROR ////////////
export interface IAwsError {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Error: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Code: string[];
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Message: string[];
    }[];
}
