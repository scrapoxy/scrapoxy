export enum EAzureQueryCredential {
    Locations = 'locations',
    VmSizes = 'vmsizes',
}


export interface IAzureLocation {
    name: string;

    description: string;
}


export interface IAzureVmSize {
    name: string;

    vcpus: number;

    memory: number;
}


export interface IAzureQueryVmSizes {
    location: string;
}
