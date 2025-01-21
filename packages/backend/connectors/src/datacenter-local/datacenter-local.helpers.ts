const REGION_TO_COUNTRY: Record<string, string> = {
    europe: 'de',
    asia: 'jp',
    northamerica: 'us',
};


export function convertDatacenterLocalRegion(region: string | null | undefined): string | null {
    if (!region) {
        return null;
    }

    return REGION_TO_COUNTRY[ region ] ?? null;
}
