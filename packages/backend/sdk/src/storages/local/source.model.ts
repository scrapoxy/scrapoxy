import type { ISource } from '@scrapoxy/common';


export interface ISourceModel extends ISource {
    nextRefreshTs: number;
}


export function toSource(p: ISourceModel): ISource {
    const s: ISource = {
        id: p.id,
        connectorId: p.connectorId,
        projectId: p.projectId,
        url: p.url,
        delay: p.delay,
        lastRefreshTs: p.lastRefreshTs,
        lastRefreshError: p.lastRefreshError,
    };

    return s;
}
