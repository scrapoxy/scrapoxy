import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import type {
    IAuthService,
    IUserToUpdate,
    IUserView,
} from '@scrapoxy/common';


@Injectable()
export class CommanderUsersClientService {
    private readonly baseUrl = 'api/users';

    constructor(private readonly client: HttpClient) {}

    //////////// AUTHS ////////////
    async getAllAuths(): Promise<IAuthService[]> {
        const res = await lastValueFrom(this.client.get<IAuthService[]>(`${this.baseUrl}/auths`));

        return res;
    }

    getAuthUrl(auth: IAuthService): string {
        return `${this.baseUrl}/auths/${auth.type}`;
    }

    //////////// USERS ////////////
    async getUserMe(): Promise<IUserView> {
        const res = await lastValueFrom(this.client.get<IUserView>(`${this.baseUrl}/me`));

        return res;
    }

    async updateUserMe(userToUpdate: IUserToUpdate): Promise<IUserView> {
        const res = await lastValueFrom(this.client.put<IUserView>(
            `${this.baseUrl}/me`,
            userToUpdate
        ));

        return res;
    }

    renew(redirectUri: string) {
        window.location.href = `${this.baseUrl}/me/renew?redirect_uri=${redirectUri}`;
    }

    logout() {
        window.location.href = `${this.baseUrl}/me/logout`;
    }
}
