export const TASK_VIEW_META = [
    'id',
    'projectId',
    'connectorId',
    'type',
    'running',
    'cancelled',
    'stepCurrent',
    'stepMax',
    'message',
    'startAtTs',
    'endAtTs',
    'nextRetryTs',
];


export interface ITaskView {
    id: string;
    projectId: string;
    connectorId: string;
    type: string;
    running: boolean;
    cancelled: boolean;
    stepCurrent: number;
    stepMax: number;
    message: string;
    startAtTs: number;
    endAtTs: number | null;
    nextRetryTs: number;
}


export const TASK_DATA_META = [
    ...TASK_VIEW_META, 'jwt', 'data',
];


export interface ITaskData extends ITaskView {
    jwt: string;
    data: any;
}


export interface ITaskToCreate {
    type: string;
    stepMax: number;
    message: string;
    data: any;
}


export interface ITaskToUpdate {
    running: boolean;
    stepCurrent: number;
    message: string;
    nextRetryTs: number;
    data: any;
}


export interface ITaskToLock {
    projectId: string;
    taskId: string;
}


export interface ITaskFactory {
    build: (task: ITaskData) => ATaskCommand;

    validate: (data: any) => Promise<void>;
}


export interface ITaskContext {
    url: string;
}


export abstract class ATaskCommand {
    constructor(protected readonly task: ITaskData) {}

    abstract execute(context: ITaskContext): Promise<ITaskToUpdate>;

    abstract cancel(): Promise<void>;

    protected waitTask(): ITaskToUpdate {
        const taskToUpdate: ITaskToUpdate = {
            running: this.task.running,
            stepCurrent: this.task.stepCurrent,
            message: this.task.message,
            nextRetryTs: Date.now() + 4000,
            data: this.task.data,
        };

        return taskToUpdate;
    }
}
