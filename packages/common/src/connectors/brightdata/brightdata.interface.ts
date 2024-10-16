export enum EBrightdataProductType {
    DATACENTER = 'dc',
    ISP = 'res_static',
    RESIDENTIAL = 'res_rotating',
    MOBILE = 'mobile',
}


export const BRIGHTDATA_PRODUCT_TYPES = Object.values(EBrightdataProductType);


export interface IBrightdataZoneView {
    name: string;
    type: EBrightdataProductType;
}
