export enum EBrightdataProductType {
    DatacenterSharedPayperusage = 'dc_shd_ppu',
    DatacenterSharedUnlimited = 'dc_shd_unlim',
    DatacenterDedicatedUnlimited = 'dc_ded_ulim',
    IspSharedPayPerUsage = 'isp_shd_ppu', // ISP_shared
    IspSharedUnlimited = 'isp_shd_ulim', // ISP_dedicated_ip
    IspDedicatedUnlimited = 'isp_ded_ulim',
    ResidentialShared = 'res_shd',
    ResidentialDedicated = 'res_ded',
    MobileShared = 'mob_shd',
    MobileDedicated = 'mob_ded',
}


export const BRIGHTDATA_PRODUCT_TYPES = Object.values(EBrightdataProductType);


export interface IBrightdataUsername {
    username: string;
}


export interface IBrightdataZoneView {
    name: string;
    productType: EBrightdataProductType;
    password: string;
    countries: string[];
}
