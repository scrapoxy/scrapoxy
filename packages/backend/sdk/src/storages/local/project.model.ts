import type { IConnectorModel } from './connector.model';
import type { ICredentialModel } from './credential.model';
import type { ITaskModel } from './task.model';
import type {
    IProjectData,
    IProjectMetrics,
    IProjectMetricsView,
    IProjectSync,
    IWindow,
} from '@scrapoxy/common';


export interface IProjectModel extends IProjectData, IProjectMetrics {
    token: string;

    credentials: Map<string, ICredentialModel>;

    connectors: Map<string, IConnectorModel>;

    windows: Map<string, IWindow>;

    tasks: Map<string, ITaskModel>;

    usersIds: Set<string>;

    lastDataTs: number;
}


export function toProjectMetricsView(p: IProjectModel): IProjectMetricsView {
    const view: IProjectMetricsView = {
        project: {
            id: p.id,
            requests: p.requests,
            stops: p.stops,
            proxiesCreated: p.proxiesCreated,
            proxiesRemoved: p.proxiesRemoved,
            bytesReceived: p.bytesReceived,
            bytesReceivedRate: p.bytesReceivedRate,
            bytesSent: p.bytesSent,
            bytesSentRate: p.bytesSentRate,
            snapshot: p.snapshot,
            uptimeBeforeStop: p.uptimeBeforeStop,
            requestsBeforeStop: p.requestsBeforeStop,
        },
        windows: Array.from(p.windows.values()),
    };

    return view;
}


export function toProjectSync(p: IProjectModel): IProjectSync {
    const sync: IProjectSync = {
        id: p.id,
        status: p.status,
        connectorDefaultId: p.connectorDefaultId,
        autoRotate: p.autoRotate,
        autoRotateDelayRange: p.autoRotateDelayRange,
        autoScaleDown: p.autoScaleDown,
        autoScaleDownDelay: p.autoScaleDownDelay,
        lastDataTs: p.lastDataTs,
        proxiesMin: p.proxiesMin,
    };

    return sync;
}
