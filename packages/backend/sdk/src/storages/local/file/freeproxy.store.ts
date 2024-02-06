import { toOptionalValue } from '@scrapoxy/common';
import type { IConnectorStore } from './connector.store';
import type { IFreeproxyModel } from '../freeproxy.model';
import type {
    IConnectorFreeproxyConfig,
    IFreeproxyBase,
} from '@scrapoxy/common';


export interface IFreeproxyStore extends IFreeproxyBase {
    id: string;
    projectId: string;
    connectorId: string;
}


export function toFreeproxyStore(fp: IFreeproxyModel): IFreeproxyStore {
    const store: IFreeproxyStore = {
        id: fp.id,
        projectId: fp.projectId,
        connectorId: fp.connectorId,
        key: fp.key,
        type: fp.type,
        address: fp.address,
        auth: fp.auth,
    };

    return store;
}


export function fromFreeproxyStore(
    fp: IFreeproxyStore, c: IConnectorStore, nowTime: number
): IFreeproxyModel {
    const config = c.config as IConnectorFreeproxyConfig;
    const model: IFreeproxyModel = {
        id: fp.id,
        projectId: fp.projectId,
        connectorId: fp.connectorId,
        key: fp.key,
        type: fp.type,
        address: fp.address,
        auth: fp.auth,
        timeoutDisconnected: config.freeproxiesTimeoutDisconnected,
        timeoutUnreachable: toOptionalValue(config.freeproxiesTimeoutUnreachable),
        disconnectedTs: nowTime,
        fingerprint: null,
        fingerprintError: null,
        nextRefreshTs: 0,
    };

    return model;
}
