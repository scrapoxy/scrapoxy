import type { IFreeproxy } from './freeproxy.interface';


export interface ISourceBase {
    url: string;
    delay: number;
}


export const SOURCE_META = [
    'id',
    'connectorId',
    'projectId',
    'url',
    'delay',
    'lastRefreshTs',
    'lastRefreshError',
];


export interface ISource extends ISourceBase {
    id: string;
    connectorId: string;
    projectId: string;
    lastRefreshTs: number | null;
    lastRefreshError: string | null;
}


export interface ISourceRefreshed {
    id: string;
    connectorId: string;
    projectId: string;
    lastRefreshTs: number | null;
    lastRefreshError: string | null;
}


export interface ISourcesAndFreeproxies {
    sources: ISource[];
    freeproxies: IFreeproxy[];
}


export interface ISourceNextRefreshToUpdate {
    projectId: string;
    connectorId: string;
    sourceId: string;
    nextRefreshTs: number;
}
