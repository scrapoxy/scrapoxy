export enum ESmartproxyCredentialType {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    DC_DEDICATED = 'dc-dedicated',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    DC_SHARED = 'dc-shared',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    ISP_SHARED = 'isp-shared',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    ISP_DEDICATED = 'isp-dedicated',
    RESIDENTIAL = 'residential',
}


export const SMARTPROXY_PRODUCT_TYPES = Object.values(ESmartproxyCredentialType);
