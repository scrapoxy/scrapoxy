import type {
    IProfile,
    IUserToken,
} from '@scrapoxy/common';


export interface IRequestToken {
    token: string;
}


export interface IRequestUser {
    user: IUserToken;
}


export interface IRequestProfile {
    user: IProfile;
}
