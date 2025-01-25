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
                            return EBrightdataProductType.DatacenterSharedPayperusage;
                        }

                        case 'unlimited': {
                            return EBrightdataProductType.DatacenterSharedUnlimited;
                        }

                        default: {
                            return;
                        }
                    }
                }

                case 'dedicated': {
                    return EBrightdataProductType.DatacenterDedicatedUnlimited;
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
                            return EBrightdataProductType.IspSharedPayPerUsage;
                        }

                        case 'unlimited': {
                            return EBrightdataProductType.IspSharedUnlimited;
                        }

                        default: {
                            return;
                        }
                    }
                }

                case 'dedicated': {
                    return EBrightdataProductType.IspDedicatedUnlimited;
                }

                default: {
                    return;
                }
            }
        }

        case 'res_rotating': {
            switch (zone.plan?.vips_type) {
                case 'shared': {
                    return EBrightdataProductType.ResidentialShared;
                }

                case 'domain': {
                    return EBrightdataProductType.ResidentialDedicated;
                }

                default: {
                    return;
                }
            }
        }

        case 'mobile': {
            switch (zone.plan?.vips_type) {
                case 'shared': {
                    return EBrightdataProductType.MobileShared;
                }

                case 'domain': {
                    return EBrightdataProductType.MobileDedicated;
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
        case EBrightdataProductType.DatacenterSharedPayperusage: {
            return 'DC_shared';
        }

        case EBrightdataProductType.DatacenterSharedUnlimited: {
            return 'DC_dedicated_ip';
        }

        case EBrightdataProductType.DatacenterDedicatedUnlimited: {
            return 'DC_dedicated_host';
        }

        case EBrightdataProductType.IspSharedPayPerUsage: {
            return 'ISP_shared';
        }

        case EBrightdataProductType.IspSharedUnlimited: {
            return 'ISP_dedicated_ip';
        }

        case EBrightdataProductType.IspDedicatedUnlimited: {
            return 'ISP_dedicated_host';
        }

        default: {
            throw new Error(`This product ${productType} is not DC/ISP`);
        }
    }
}


export function getBrightdataPrefix(productType: EBrightdataProductType): string {
    switch (productType) {
        case EBrightdataProductType.DatacenterSharedPayperusage:
        case EBrightdataProductType.DatacenterSharedUnlimited:
        case EBrightdataProductType.DatacenterDedicatedUnlimited: {
            return 'DCT';
        }

        case EBrightdataProductType.IspSharedPayPerUsage:
        case EBrightdataProductType.IspSharedUnlimited:
        case EBrightdataProductType.IspDedicatedUnlimited: {
            return 'ISP';
        }

        case EBrightdataProductType.ResidentialShared:
        case EBrightdataProductType.ResidentialDedicated: {
            return 'RES';
        }

        case EBrightdataProductType.MobileShared:
        case EBrightdataProductType.MobileDedicated: {
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
