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
        transportType: proxy.transportType,
        connectorId: proxy.connectorId,
        projectId: proxy.projectId,
        key: proxy.key,
        config: proxy.config,
        useragent: proxy.useragent,
        timeoutDisconnected: proxy.timeoutDisconnected,
        ciphers: proxy.ciphers,
    };

    return connect;
}


export function toProxyToRefresh(proxy: IProxyModel): IProxyToRefresh {
    const connect: IProxyToRefresh = {
        id: proxy.id,
        type: proxy.type,
        transportType: proxy.transportType,
        connectorId: proxy.connectorId,
        projectId: proxy.projectId,
        key: proxy.key,
        config: proxy.config,
        useragent: proxy.useragent,
        timeoutDisconnected: proxy.timeoutDisconnected,
        ciphers: proxy.ciphers,
        requests: proxy.requests,
        requestsValid: proxy.requestsValid,
        requestsInvalid: proxy.requestsInvalid,
        bytesReceived: proxy.bytesReceived,
        bytesSent: proxy.bytesSent,
        countryLike: proxy.countryLike,
    };

    return connect;
}
