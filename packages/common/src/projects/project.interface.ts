import type {
    ISnapshot,
    IWindow,
    IWindowAdd,
} from './metrics/window.interface';
import type { ICertificate } from '../certificate';
import type { IOptionalValue } from '../optional';
import type { EConnectMode } from '../proxies';
import type { IRange } from '../range';


export enum EProjectStatus {
    OFF = 'OFF',
    CALM = 'CALM',
    HOT = 'HOT',
}


export interface IProjectStatus {
    status: EProjectStatus;
}


export interface IProjectConnectorDefaultId {
    connectorDefaultId: string | null;
}


export interface IProjectToken {
    token: string;
}


export interface IProjectTokenToUpdate extends IProjectToken {
    projectId: string;
}


export interface IProjectUserLink {
    userId: string;
    projectId: string;
}


export const PROJECT_VIEW_META = [
    'id',
    'name',
    'status',
    'connectorDefaultId',
    'certificateEndAt',
];


export interface IProjectView extends IProjectConnectorDefaultId {
    id: string;
    name: string;
    status: EProjectStatus;
}


export const PROJECT_DATA_META = [
    ...PROJECT_VIEW_META,
    'autoRotate',
    'autoRotateDelayRange',
    'autoScaleUp',
    'autoScaleDown',
    'cookieSession',
    'mitm',
    'proxiesMin',
    'useragentOverride',
];


export interface IProjectData extends IProjectView {
    autoRotate: boolean;
    autoRotateDelayRange: IRange;
    autoScaleUp: boolean;
    autoScaleDown: IOptionalValue<number>;
    cookieSession: boolean;
    mitm: boolean;
    proxiesMin: number;
    useragentOverride: boolean;
}


export const PROJECT_SYNC_META = [
    'id',
    'autoRotate',
    'autoRotateDelayRange',
    'autoScaleDown',
    'connectorDefaultId',
    'lastDataTs',
    'proxiesMin',
    'status',
];


export interface IProjectSync extends IProjectStatus, IProjectConnectorDefaultId {
    id: string;
    autoRotate: boolean;
    autoRotateDelayRange: IRange;
    autoScaleDown: IOptionalValue<number>;
    lastDataTs: number;
    proxiesMin: number;
}


export interface IProjectDataCreate {
    userId: string;
    token: string;
    project: IProjectData;
}


export interface IProjectToConnect {
    id: string;
    autoScaleUp: boolean;
    certificate: ICertificate | null;
    cookieSession: boolean;
    status: EProjectStatus;
    useragentOverride: boolean;
}


export interface IProjectToConnectQuery {
    mode: EConnectMode;
    certificateHostname: string | null;
}


export interface IProjectToCreate {
    name: string;
    autoRotate: boolean;
    autoRotateDelayRange: IRange;
    autoScaleUp: boolean;
    autoScaleDown: IOptionalValue<number>;
    cookieSession: boolean;
    mitm: boolean;
    proxiesMin: number;
    useragentOverride: boolean;
}


export type IProjectToUpdate = IProjectToCreate;


export interface IProjectLastDataToUpdate {
    projectId: string;
    lastDataTs: number;
}


export interface IRangeMetrics {
    sum: number;
    count: number;
    min?: number;
    max?: number;
}


export const PROJECT_METRICS_META = [
    'id',
    'requests',
    'stops',
    'proxiesCreated',
    'proxiesRemoved',
    'bytesReceived',
    'bytesReceivedRate',
    'bytesSent',
    'bytesSentRate',
    'requestsBeforeStop',
    'uptimeBeforeStop',
    'snapshot',
];


export interface IProjectMetrics {
    id: string;
    requests: number;
    stops: number;
    proxiesCreated: number;
    proxiesRemoved: number;
    bytesReceived: number;
    bytesReceivedRate: number;
    bytesSent: number;
    bytesSentRate: number;
    requestsBeforeStop: IRangeMetrics;
    uptimeBeforeStop: IRangeMetrics;
    snapshot: ISnapshot;
}


export interface IProjectMetricsView {
    project: IProjectMetrics;
    windows: IWindow[];
}


export interface IProjectMetricsAdd {
    id: string;
    requests?: number;
    stops?: number;
    proxiesCreated?: number;
    proxiesRemoved?: number;
    bytesReceived?: number;
    bytesSent?: number;
    requestsBeforeStop?: IRangeMetrics;
    uptimeBeforeStop?: IRangeMetrics;
    snapshot?: ISnapshot;
}


export interface IProjectMetricsAddView {
    project: IProjectMetricsAdd;
    windows?: IWindowAdd[];
}
