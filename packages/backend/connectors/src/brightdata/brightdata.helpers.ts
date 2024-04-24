import { EBrightdataProductType } from './brightdata.interface';


export function getBrightdataPrefix(zoneType: EBrightdataProductType): string {
    switch (zoneType) {
        case EBrightdataProductType.DATACENTER: {
            return 'DCT';
        }

        case EBrightdataProductType.ISP: {
            return 'ISP';
        }

        case EBrightdataProductType.RESIDENTIAL: {
            return 'RES';
        }

        case EBrightdataProductType.MOBILE: {
            return 'MOB';
        }
    }
}
