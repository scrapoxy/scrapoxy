export enum EAwsQueryCredential {
    Regions = 'regions',
    InstanceTypes = 'instancetypes',
}


export interface IAwsQueryInstanceType {
    region: string;
}
