import { SCRAPOXY_USER_AGENT_PREFIX } from '@scrapoxy/common';


export function formatUseragent(version: string): string {
    return `${SCRAPOXY_USER_AGENT_PREFIX}/${version} (${process.platform ?? 'unknown'}; ${process.arch ?? 'unknown'}; ${process.version ?? 'unknown'})`;
}
