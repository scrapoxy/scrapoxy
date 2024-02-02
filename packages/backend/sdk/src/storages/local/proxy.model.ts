import type {
    IProxyData,
    IProxySync,
    IProxyToConnect,
    IProxyToRefresh,
    IProxyView,
} from '@scrapoxy/common';


export interface IProxyModel extends IProxyData, IProxySync, IProxyView {
    nextRefreshTs: number;

    lastConnectionTs: number;
}


export function toProxyToConnect(proxy: IProxyModel): IProxyToConnect {
    const connect: IProxyToConnect = {
        id: proxy.id,
        type: proxy.type,
        connectorId: proxy.connectorId,
        projectId: proxy.projectId,
        key: proxy.key,
        config: proxy.config,
        useragent: proxy.useragent,
        timeout: proxy.timeout,
    };

    return connect;
}


export function toProxyToRefresh(proxy: IProxyModel): IProxyToRefresh {
    const connect: IProxyToRefresh = {
        id: proxy.id,
        type: proxy.type,
        connectorId: proxy.connectorId,
        projectId: proxy.projectId,
        key: proxy.key,
        config: proxy.config,
        useragent: proxy.useragent,
        timeout: proxy.timeout,
        bytesReceived: proxy.bytesReceived,
        bytesSent: proxy.bytesSent,
        requests: proxy.requests,
    };

    return connect;
}
