import type { ITaskData } from '@scrapoxy/common';


export interface ITaskModel extends ITaskData {
    locked: boolean;
}
