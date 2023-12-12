import { Injectable } from '@nestjs/common';
import { AuthprovidersService } from '@scrapoxy/backend-sdk';
import { AUTH_LOCAL_NAME } from './local.constants';
import type { IAuthService } from '@scrapoxy/common';


@Injectable()
export class AuthLocalService implements IAuthService {
    readonly type = AUTH_LOCAL_NAME;

    readonly name = 'local';

    readonly icon = '';

    constructor(authproviders: AuthprovidersService) {
        authproviders.register(this);
    }
}
