import type { ILiveproxiesPlanB2C } from '@scrapoxy/common';


export function toLiveproxiesPlanB2C(p: ILiveproxiesPlanB2C): ILiveproxiesPlanB2C {
    const plan: ILiveproxiesPlanB2C = {
        packageId: p.packageId,
        packageStatus: p.packageStatus,
        productName: p.productName,
    };

    return plan;
}
