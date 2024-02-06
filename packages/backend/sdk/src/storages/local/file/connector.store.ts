import { toConnectorData } from '@scrapoxy/common';
import {
    fromFreeproxyStore,
    toFreeproxyStore,
} from './freeproxy.store';
import type { IFreeproxyStore } from './freeproxy.store';
import type { IConnectorModel } from '../connector.model';
import type { IFreeproxyModel } from '../freeproxy.model';
import type { IProxyModel } from '../proxy.model';
import type { ISourceModel } from '../source.model';
import type {
    ICertificate,
    IConnectorData,
    ISource,
} from '@scrapoxy/common';


export interface IConnectorStore extends IConnectorData {
    certificate: ICertificate | null;
    sources: ISource[];
    freeproxies: IFreeproxyStore[];
}


export function toConnectorStore(c: IConnectorModel): IConnectorStore {
    const freeproxies = Array.from(c.freeproxies.values())
        .map(toFreeproxyStore);
    const store: IConnectorStore = {
        ...toConnectorData(c),
        certificate: c.certificate,
        sources: Array.from(c.sources.values()),
        freeproxies,
    };

    return store;
}


export function fromConnectorStore(
    c: IConnectorStore, nowTime: number
): IConnectorModel {
    const sources = new Map<string, ISourceModel>();
    for (const source of c.sources) {
        const sourceModel: ISourceModel = {
            ...source,
            nextRefreshTs: nowTime,
        };
        sources.set(
            source.id,
            sourceModel
        );
    }

    const freeproxies = new Map<string, IFreeproxyModel>();
    for (const freeproxy of c.freeproxies) {
        const freeproxyModel = fromFreeproxyStore(
            freeproxy,
            c,
            nowTime
        );

        freeproxies.set(
            freeproxy.id,
            freeproxyModel
        );
    }

    const model: IConnectorModel = {
        id: c.id,
        projectId: c.projectId,
        name: c.name,
        type: c.type,
        active: c.active,
        proxiesMax: c.proxiesMax,
        proxiesTimeoutDisconnected: c.proxiesTimeoutDisconnected,
        proxiesTimeoutUnreachable: c.proxiesTimeoutUnreachable,
        error: c.error,
        config: c.config,
        credentialId: c.credentialId,
        nextRefreshTs: 0,
        certificate: c.certificate,
        certificateEndAt: c.certificateEndAt,
        proxies: new Map<string, IProxyModel>(),
        sources,
        freeproxies,
    };

    return model;
}
