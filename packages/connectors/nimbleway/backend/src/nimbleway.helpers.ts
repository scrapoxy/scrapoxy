import type { INimblewaySessionOptions } from './nimbleway.interface';


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
