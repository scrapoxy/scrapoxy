import type { IProxySellerGeoCountryView } from '@scrapoxy/common';


export function toProxySellerGeoCountryView(i: IProxySellerGeoCountryView): IProxySellerGeoCountryView {
    const item: IProxySellerGeoCountryView = {
        code: i.code,
        name: i.name,
    };

    return item;
}
