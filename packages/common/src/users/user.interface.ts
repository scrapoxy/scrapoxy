export interface IUserToUpdate {
    name: string;
    email: string | null;
    picture: string | null;
}


export interface IUserToCreate extends IUserToUpdate{
    id: string;
}


export type IProfile = IUserToCreate;


export interface IUserToken {
    id: string;
    complete: boolean;
}


export const USER_VIEW_META = [
    'id',
    'name',
    'email',
    'picture',
    'complete',
];


export interface IUserView extends IUserToken {
    name: string;
    email: string | null;
    picture: string | null;
}


export const USER_DATA_META = USER_VIEW_META;


export type IUserData = IUserView;


export const USER_PROJECT_META = [
    'id', 'name', 'email',
];


export interface IUserProject {
    id: string;
    name: string;
    email: string;
}


export interface IUserProjectEmail {
    email: string;
}


export interface IAuthService {
    type: string;
    name: string;
    icon: string;
}
