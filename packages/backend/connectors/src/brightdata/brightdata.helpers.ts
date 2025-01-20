import {
    CONNECTOR_BRIGHTDATA_TYPE,
    EBrightdataProductType,
    EProxyStatus,
} from '@scrapoxy/common';
import type {
    IBrightdataZoneData,
    ITransportProxyRefreshedConfigBrightdata,
} from './brightdata.interface';
import type { IConnectorProxyRefreshed } from '@scrapoxy/common';


export function toBrightdataProductType(zone: IBrightdataZoneData): EBrightdataProductType | undefined {
    switch (zone.plan?.product) {
        case 'dc': {
            switch (zone.plan?.ips_type) {
                case 'shared': {
                    switch (zone.plan?.bandwidth) {
                        case 'payperusage': {
                            return EBrightdataProductType.DATACENTER_SHARED_PAYPERUSAGE;
                        }

                        case 'unlimited': {
                            return EBrightdataProductType.DATACENTER_SHARED_UNLIMITED;
                        }

                        default: {
                            return;
                        }
                    }
                }

                case 'dedicated': {
                    return EBrightdataProductType.DATACENTER_DEDICATED_UNLIMITED;
                }

                default: {
                    return;
                }
            }
        }

        case 'res_static': {
            switch (zone.plan?.ips_type) {
                case 'shared': {
                    switch (zone.plan?.bandwidth) {
                        case 'payperusage': {
                            return EBrightdataProductType.ISP_SHARED_PAYPERUSAGE;
                        }

                        case 'unlimited': {
                            return EBrightdataProductType.ISP_SHARED_UNLIMITED;
                        }

                        default: {
                            return;
                        }
                    }
                }

                case 'dedicated': {
                    return EBrightdataProductType.ISP_DEDICATED_UNLIMITED;
                }

                default: {
                    return;
                }
            }
        }

        case 'res_rotating': {
            switch (zone.plan?.vips_type) {
                case 'shared': {
                    return EBrightdataProductType.RESIDENTIAL_SHARED;
                }

                case 'domain': {
                    return EBrightdataProductType.RESIDENTIAL_DEDICATED;
                }

                default: {
                    return;
                }
            }
        }

        case 'mobile': {
            switch (zone.plan?.vips_type) {
                case 'shared': {
                    return EBrightdataProductType.MOBILE_SHARED;
                }

                case 'domain': {
                    return EBrightdataProductType.MOBILE_DEDICATED;
                }

                default: {
                    return;
                }
            }
        }

        default: {
            return;
        }
    }
}


export function toBrightdataCountryProductType(productType: EBrightdataProductType): string {
    switch (productType) {
        case EBrightdataProductType.DATACENTER_SHARED_PAYPERUSAGE: {
            return 'DC_shared';
        }

        case EBrightdataProductType.DATACENTER_SHARED_UNLIMITED: {
            return 'DC_dedicated_ip';
        }

        case EBrightdataProductType.DATACENTER_DEDICATED_UNLIMITED: {
            return 'DC_dedicated_host';
        }

        case EBrightdataProductType.ISP_SHARED_PAYPERUSAGE: {
            return 'ISP_shared';
        }

        case EBrightdataProductType.ISP_SHARED_UNLIMITED: {
            return 'ISP_dedicated_ip';
        }

        case EBrightdataProductType.ISP_DEDICATED_UNLIMITED: {
            return 'ISP_dedicated_host';
        }

        default: {
            throw new Error(`This product ${productType} is not DC/ISP`);
        }
    }
}


export function getBrightdataPrefix(productType: EBrightdataProductType): string {
    switch (productType) {
        case EBrightdataProductType.DATACENTER_SHARED_PAYPERUSAGE:
        case EBrightdataProductType.DATACENTER_SHARED_UNLIMITED:
        case EBrightdataProductType.DATACENTER_DEDICATED_UNLIMITED: {
            return 'DCT';
        }

        case EBrightdataProductType.ISP_SHARED_PAYPERUSAGE:
        case EBrightdataProductType.ISP_SHARED_UNLIMITED:
        case EBrightdataProductType.ISP_DEDICATED_UNLIMITED: {
            return 'ISP';
        }

        case EBrightdataProductType.RESIDENTIAL_SHARED:
        case EBrightdataProductType.RESIDENTIAL_DEDICATED: {
            return 'RES';
        }

        case EBrightdataProductType.MOBILE_SHARED:
        case EBrightdataProductType.MOBILE_DEDICATED: {
            return 'MOB';
        }
    }
}


export function convertToProxy(
    key: string,
    transportType: string,
    removingForceCap: boolean,
    username: string,
    password: string,
    country: string
): IConnectorProxyRefreshed {
    const config: ITransportProxyRefreshedConfigBrightdata = {
        username,
        password,
    };
    const p: IConnectorProxyRefreshed = {
        type: CONNECTOR_BRIGHTDATA_TYPE,
        transportType,
        key,
        name: key,
        status: EProxyStatus.STARTED,
        removingForceCap,
        config,
        countryLike: country !== 'all' ? country : null,
    };

    return p;
}
