import {
    toConnectorSync,
    toConnectorView,
    toProxySync,
    toProxyView,
} from '@scrapoxy/common';
import type { IFreeproxyModel } from './freeproxy.model';
import type { IProxyModel } from './proxy.model';
import type {
    ICertificate,
    IConnectorData,
    IConnectorProxiesSync,
    IConnectorProxiesView,
} from '@scrapoxy/common';


export interface IConnectorModel extends IConnectorData {
    certificate: ICertificate | null;

    nextRefreshTs: number;

    freeproxies: Map<string, IFreeproxyModel>;

    proxies: Map<string, IProxyModel>;
}


export function toConnectorProxiesView(c: IConnectorModel): IConnectorProxiesView {
    const view: IConnectorProxiesView = {
        connector: toConnectorView(c),
        proxies: Array.from(c.proxies.values())
            .map(toProxyView),
    };

    return view;
}


export function toConnectorProxiesSync(c: IConnectorModel): IConnectorProxiesSync {
    const sync: IConnectorProxiesSync = {
        connector: toConnectorSync(c),
        proxies: Array.from(c.proxies.values())
            .map(toProxySync),
    };

    return sync;
}
