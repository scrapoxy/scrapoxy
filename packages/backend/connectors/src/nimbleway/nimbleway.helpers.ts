import type { INimblewaySessionOptions } from './nimbleway.interface';
import type { INimblewayGeoItem } from '@scrapoxy/common';


export function formatUsername(
    username: string, options: INimblewaySessionOptions
): string {
    const lines = [
        `account-${username}`, 'pipeline-nimbleip',
    ];

    if (options.country !== 'all') {
        lines.push(`country-${options.country.toUpperCase()}`);
    }

    lines.push(`session-${options.session}`);

    return lines.join('-');
}


export function toNimblewayGeoItem(i: INimblewayGeoItem): INimblewayGeoItem {
    const item: INimblewayGeoItem = {
        code: i.code.toLowerCase(),
        name: i.name,
    };

    return item;
}
