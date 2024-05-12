export interface ISnapshot {
    requests: number;
    requestsValid: number;
    requestsInvalid: number;
    stops: number;
    bytesReceived: number;
    bytesSent: number;
}


export interface IWindow {
    id: string;
    projectId: string;
    delay: number;
    size: number;
    count: number;
    requests: number;
    requestsValid: number;
    requestsInvalid: number;
    stops: number;
    bytesReceived: number;
    bytesSent: number;
    snapshots: ISnapshot[];
}


export interface IWindowAdd {
    id: string;
    projectId: string;
    size: number;
    count: number;
    requests: number;
    requestsValid: number;
    requestsInvalid: number;
    stops: number;
    bytesReceived: number;
    bytesSent: number;
    snapshot: ISnapshot | null;
}


export interface IWindowConfig {
    delay: number;
    size: number;
}
