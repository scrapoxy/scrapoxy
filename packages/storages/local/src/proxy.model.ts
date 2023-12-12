import type {
    IProxyData,
    IProxySync,
    IProxyToConnect,
    IProxyView,
} from '@scrapoxy/common';


export interface IProxyModel extends IProxyData, IProxySync, IProxyView {
    nextRefreshTs: number;
    lastConnectionTs: number;
}


export function toProxyToConnectBase(proxy: IProxyModel): IProxyToConnect {
    const connect: IProxyToConnect = {
        id: proxy.id,
        type: proxy.type,
        connectorId: proxy.connectorId,
        projectId: proxy.projectId,
        key: proxy.key,
        config: proxy.config,
        useragent: proxy.useragent,
    };

    return connect;
}
