export enum ETencentQueryCredential {
    Regions = 'regions',
    Zones = 'zones',
    InstanceTypes = 'instancetypes',
}

export interface ITencentQueryZone {
    region: string;
}

export interface ITencentQueryInstanceType {
    region: string;
    zone: string;
}
