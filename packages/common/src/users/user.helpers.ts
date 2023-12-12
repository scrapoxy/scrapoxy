import type {
    IUserData,
    IUserProject,
    IUserToCreate,
    IUserToken,
    IUserToUpdate,
    IUserView,
} from './user.interface';


export function isUserComplete(user: IUserToCreate | IUserToUpdate): boolean {
    return !!user.email && user.email.includes('@');
}


export function toUserToken(u: IUserToken): IUserToken {
    const user: IUserToken = {
        id: u.id,
        complete: u.complete,
    };

    return user;
}


export function toUserView(u: IUserView): IUserView {
    const view: IUserView = {
        id: u.id,
        name: u.name,
        email: u.email,
        picture: u.picture,
        complete: u.complete,
    };

    return view;
}


export function toUserData(u: IUserData): IUserData {
    const view: IUserData = {
        id: u.id,
        name: u.name,
        email: u.email,
        picture: u.picture,
        complete: u.complete,
    };

    return view;
}


export function toUserProject(u: IUserData): IUserProject {
    const view: IUserProject = {
        id: u.id,
        name: u.name,
        email: u.email as string, // Always defined
    };

    return view;
}
