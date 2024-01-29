import { Injectable } from '@nestjs/common';
import { AUTH_GOOGLE_NAME } from './google.constants';
import { AuthprovidersService } from '../providers.service';
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
