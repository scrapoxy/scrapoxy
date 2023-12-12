import type { IUserModel } from '../user.model';
import type { IUserData } from '@scrapoxy/common';


export type IUserStore = IUserData;


export function toUserStore(p: IUserModel): IUserStore {
    const store: IUserStore = {
        id: p.id,
        name: p.name,
        email: p.email,
        picture: p.picture,
        complete: p.complete,
    };

    return store;
}


export function fromUserStore(
    p: IUserStore, projectsIds: Set<string>
): IUserModel {
    const model: IUserModel = {
        id: p.id,
        name: p.name,
        email: p.email,
        picture: p.picture,
        complete: p.complete,
        projectsIds,
    };

    return model;
}
