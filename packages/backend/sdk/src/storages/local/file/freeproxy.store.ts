import type { IFreeproxyModel } from '../freeproxy.model';
import type { IFreeproxyBase } from '@scrapoxy/common';


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


export function fromFreeproxyStore(fp: IFreeproxyStore): IFreeproxyModel {
    const model: IFreeproxyModel = {
        id: fp.id,
        projectId: fp.projectId,
        connectorId: fp.connectorId,
        key: fp.key,
        type: fp.type,
        address: fp.address,
        auth: fp.auth,
        fingerprint: null,
        fingerprintError: null,
        nextRefreshTs: 0,
    };

    return model;
}
