import type { IFreeproxy } from './freeproxy.interface';


export const SOURCE_BASE_META = [
    'url', 'delay',
];


export const SOURCE_BASE_SWAGGER_PROPS = {
    url: {
        type: 'string',
        description: 'url of the source',
        example: 'http://source-of-urls.com/list.csv',
    },
    delay: {
        type: 'number',
        description: 'delay in ms between 2 fetches of the source',
        example: 60000,
    },
};


export interface ISourceBase {
    url: string;
    delay: number;
}


export const SOURCE_META = [
    ...SOURCE_BASE_META,
    'id',
    'connectorId',
    'projectId',
    'lastRefreshTs',
    'lastRefreshError',
];


export const SOURCE_SWAGGER_PROPS = {
    ...SOURCE_BASE_SWAGGER_PROPS,
    id: {
        type: 'string',
        description: 'uuid of the source',
        example: 'b79b9533-a764-4bf2-9ff8-64aa7d4e7508',
    },
    connectorId: {
        type: 'string',
        description: 'uuid of the connector',
        example: '5f7895e6-a48d-4831-95d8-51b0b55ddcc2',
    },
    projectId: {
        type: 'string',
        description: 'uuid of the project',
        example: '77c3302e-41e3-43f7-b033-4bd802f2d521',
    },
    lastRefreshTs: {
        type: 'number',
        nullable: true,
        description: 'timestamp in ms of the last refresh of the source',
        example: 1711791332000,

    },
    lastRefreshError: {
        type: 'string',
        nullable: true,
        description: 'error message if the last refresh of the source is in error',
        example: 'domain not found',
    },
};


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
