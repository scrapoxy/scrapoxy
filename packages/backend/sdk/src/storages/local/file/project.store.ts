import {
    toCredentialData,
    WINDOWS_CONFIG,
} from '@scrapoxy/common';
import { v4 as uuid } from 'uuid';
import {
    fromConnectorStore,
    toConnectorStore,
} from './connector.store';
import type { IConnectorStore } from './connector.store';
import type { IConnectorModel } from '../connector.model';
import type { ICredentialModel } from '../credential.model';
import type { IProjectModel } from '../project.model';
import type { ITaskModel } from '../task.model';
import type {
    ICredentialData,
    IProjectData,
    IWindow,
} from '@scrapoxy/common';


export interface IProjectStore extends IProjectData {
    token: string;
    credentials: ICredentialData[];
    connectors: IConnectorStore[];
    usersIds: string[];
}


export function toProjectStore(p: IProjectModel): IProjectStore {
    const
        connectors = Array.from(p.connectors.values())
            .map(toConnectorStore),
        credentials = Array.from(p.credentials.values())
            .map(toCredentialData);
    const store: IProjectStore = {
        id: p.id,
        name: p.name,
        status: p.status,
        connectorDefaultId: p.connectorDefaultId,
        token: p.token,
        autoRotate: p.autoRotate,
        autoRotateDelayRange: p.autoRotateDelayRange,
        autoScaleUp: p.autoScaleUp,
        autoScaleDown: p.autoScaleDown,
        autoScaleDownDelay: p.autoScaleDownDelay,
        cookieSession: p.cookieSession,
        mitm: p.mitm,
        proxiesMin: p.proxiesMin,
        useragentOverride: p.useragentOverride,
        credentials,
        connectors,
        usersIds: Array.from(p.usersIds),

    };

    return store;
}


export function fromProjectStore(p: IProjectStore): IProjectModel {
    // Credentials
    const credentials = new Map<string, ICredentialModel>();
    for (const c of p.credentials) {
        credentials.set(
            c.id,
            c
        );
    }

    // Connectors
    const connectors = new Map<string, IConnectorModel>();
    for (const c of p.connectors) {
        const model = fromConnectorStore(c);
        connectors.set(
            model.id,
            model
        );
    }

    // Windows
    const windows = new Map<string, IWindow>();
    for (const c of WINDOWS_CONFIG) {
        const window: IWindow = {
            id: uuid(),
            projectId: p.id,
            delay: c.delay,
            size: c.size,
            count: 0,
            requests: 0,
            stops: 0,
            bytesReceived: 0,
            bytesSent: 0,
            snapshots: [],
        };

        windows.set(
            window.id,
            window
        );
    }

    const model: IProjectModel = {
        id: p.id,
        name: p.name,
        status: p.status,
        connectorDefaultId: p.connectorDefaultId,
        token: p.token,
        autoRotate: p.autoRotate,
        autoRotateDelayRange: p.autoRotateDelayRange,
        autoScaleUp: p.autoScaleUp,
        autoScaleDown: p.autoScaleDown,
        autoScaleDownDelay: p.autoScaleDownDelay,
        cookieSession: p.cookieSession,
        mitm: p.mitm,
        proxiesMin: p.proxiesMin,
        useragentOverride: p.useragentOverride,
        requests: 0,
        stops: 0,
        proxiesCreated: 0,
        proxiesRemoved: 0,
        bytesReceived: 0,
        bytesReceivedRate: 0,
        bytesSent: 0,
        bytesSentRate: 0,
        requestsBeforeStop: {
            sum: 0,
            count: 0,
            min: void 0,
            max: void 0,
        },
        uptimeBeforeStop: {
            sum: 0,
            count: 0,
            min: void 0,
            max: void 0,
        },
        snapshot: {
            requests: 0,
            stops: 0,
            bytesReceived: 0,
            bytesSent: 0,
        },
        credentials,
        connectors: connectors,
        windows,
        tasks: new Map<string, ITaskModel>(),
        usersIds: new Set<string>(p.usersIds),
        lastDataTs: Date.now(),
    };

    return model;
}
