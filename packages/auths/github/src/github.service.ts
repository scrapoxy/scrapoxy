import { Injectable } from '@nestjs/common';
import { AuthprovidersService } from '@scrapoxy/backend-sdk';
import { AUTH_GITHUB_NAME } from './github.constants';
import type { IAuthService } from '@scrapoxy/common';


@Injectable()
export class AuthGithubService implements IAuthService {
    readonly type = AUTH_GITHUB_NAME;

    readonly name = 'Github';

    readonly icon = 'cibGithub';

    constructor(authproviders: AuthprovidersService) {
        authproviders.register(this);
    }
}
