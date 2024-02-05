import {
    EProxyrackOs,
    EProxyrackProductType,
} from './proxyrack.interface';
import type { IProxyrackSessionOptions } from './proxyrack.interface';


export function formatUsername(
    username: string, options: IProxyrackSessionOptions
): string {
    const lines = [
        username, `session-${options.session}`,
    ];

    if (options.country !== 'all') {
        lines.push(`country-${options.country.toUpperCase()}`);

        if (options.city !== 'all') {
            lines.push(`city-${options.city}`);
        }

        if (options.isp !== 'all') {
            lines.push(`isp-${options.isp}`);
        }
    }

    if (options.osName !== EProxyrackOs.All) {
        lines.push(`osName-${options.osName}`);
    }

    return lines.join('-');
}


export function productToHostname(product: EProxyrackProductType): string {
    switch (product) {
        case EProxyrackProductType.PrivateUnmeteredResidential: {
            return 'private.residential.proxyrack.net';
            break;
        }

        default: {
            throw new Error(`Unknown product type: ${product}`);
        }
    }
}
