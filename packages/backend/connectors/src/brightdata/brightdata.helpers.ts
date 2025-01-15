import {
    CONNECTOR_BRIGHTDATA_TYPE,
    EBrightdataProductType,
    EProxyStatus,
} from '@scrapoxy/common';
import type { ITransportProxyRefreshedConfigBrightdata } from './brightdata.interface';
import type {
    IBrightdataZoneView,
    IConnectorProxyRefreshed,
} from '@scrapoxy/common';


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


export function convertToProxy(
    key: string,
    transportType: string,
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
        config,
        countryLike: country !== 'all' ? country : null,
    };

    return p;
}
