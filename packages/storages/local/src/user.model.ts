import type { IUserData } from '@scrapoxy/common';


export interface IUserModel extends IUserData {
    projectsIds: Set<string>;
}
