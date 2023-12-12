import { Injectable } from '@nestjs/common';
import { AuthprovidersService } from '@scrapoxy/backend-sdk';
import { AUTH_GOOGLE_NAME } from './google.constants';
import type { IAuthService } from '@scrapoxy/common';


@Injectable()
export class AuthGoogleService implements IAuthService {
    readonly type = AUTH_GOOGLE_NAME;

    readonly name = 'Google';

    readonly icon = 'cibGoogle';

    constructor(authproviders: AuthprovidersService) {
        authproviders.register(this);
    }
}
