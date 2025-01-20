export enum EBrightdataProductType {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    DATACENTER_SHARED_PAYPERUSAGE = 'dc_shd_ppu',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    DATACENTER_SHARED_UNLIMITED = 'dc_shd_unlim',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    DATACENTER_DEDICATED_UNLIMITED = 'dc_ded_ulim',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    ISP_SHARED_PAYPERUSAGE = 'isp_shd_ppu', // ISP_shared
    // eslint-disable-next-line @typescript-eslint/naming-convention
    ISP_SHARED_UNLIMITED = 'isp_shd_ulim', // ISP_dedicated_ip
    // eslint-disable-next-line @typescript-eslint/naming-convention
    ISP_DEDICATED_UNLIMITED = 'isp_ded_ulim',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    RESIDENTIAL_SHARED = 'res_shd',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    RESIDENTIAL_DEDICATED = 'res_ded',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    MOBILE_SHARED = 'mob_shd',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    MOBILE_DEDICATED = 'mob_ded',
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
