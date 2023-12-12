import type {
    ITaskData,
    ITaskView,
} from './task.interface';


export function toTaskView(t: ITaskView): ITaskView {
    const view: ITaskView = {
        id: t.id,
        projectId: t.projectId,
        connectorId: t.connectorId,
        type: t.type,
        running: t.running,
        cancelled: t.cancelled,
        stepCurrent: t.stepCurrent,
        stepMax: t.stepMax,
        message: t.message,
        startAtTs: t.startAtTs,
        endAtTs: t.endAtTs,
        nextRetryTs: t.nextRetryTs,
    };

    return view;
}


export function toTaskData(t: ITaskData): ITaskData {
    const data: ITaskData = {
        id: t.id,
        projectId: t.projectId,
        connectorId: t.connectorId,
        type: t.type,
        running: t.running,
        cancelled: t.cancelled,
        stepCurrent: t.stepCurrent,
        stepMax: t.stepMax,
        message: t.message,
        startAtTs: t.startAtTs,
        endAtTs: t.endAtTs,
        nextRetryTs: t.nextRetryTs,
        jwt: t.jwt,
        data: t.data,
    };

    return data;
}


export function isTaskSucceed(task: ITaskView): boolean {
    return !task.running && task.stepCurrent === task.stepMax;
}


export function isTaskFailed(task: ITaskView): boolean {
    return !task.running && task.stepCurrent !== task.stepMax;
}
