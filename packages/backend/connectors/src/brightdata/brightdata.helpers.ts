import { EBrightdataProductType } from './brightdata.interface';
import type { IBrightdataZoneView } from './brightdata.interface';


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


export function toBrightdataZoneView(z: IBrightdataZoneView): IBrightdataZoneView {
    const zone: IBrightdataZoneView = {
        type: z.type,
        name: z.name,
    };

    return zone;
}
