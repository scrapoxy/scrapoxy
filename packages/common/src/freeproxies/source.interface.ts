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
];


export interface ISource extends ISourceBase {
    id: string;
    connectorId: string;
    projectId: string;
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
