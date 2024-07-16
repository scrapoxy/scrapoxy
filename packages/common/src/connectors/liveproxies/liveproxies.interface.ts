export enum ELiveproxiesPlanStatus {
    ACTIVE = '1',
}


export interface ILiveproxiesPlanB2C {
    packageId: number;
    packageStatus: ELiveproxiesPlanStatus;
    productName: string;
}
