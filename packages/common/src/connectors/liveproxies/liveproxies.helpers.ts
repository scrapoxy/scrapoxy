export function isLiveproxiesEnterprisePlan(productName: string): boolean {
    return [
        'CUSTOM PLAN', 'ENTERPRISE',
    ].includes(productName);
}
