import {
    Inject,
    Injectable,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { Observable } from 'rxjs';
import { COMMANDER_FRONTEND_MODULE_CONFIG } from './frontend.constants';
import {
    JwtInvalidError,
    UserProfileIncompleteError,
} from '../../errors';
import { parserAuthFromHeaders } from '../../helpers';
import type { ICommanderFrontendModuleConfig } from './frontend.module';
import type {
    CanActivate,
    ExecutionContext,
} from '@nestjs/common';
import type { IUserToken } from '@scrapoxy/common';


@Injectable()
export class CommanderFrontendTokenGuard implements CanActivate {
    constructor(@Inject(COMMANDER_FRONTEND_MODULE_CONFIG)
    private readonly config: ICommanderFrontendModuleConfig) {}

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const request = context.switchToHttp()
            .getRequest();
        const token = parserAuthFromHeaders(request.headers);

        if (!token) {
            throw new JwtInvalidError('JWT missing');
        }

        let user: IUserToken;
        try {
            user = jwt.verify(
                token,
                this.config.jwt.secret
            ) as IUserToken;
        } catch (err: any) {
            throw new JwtInvalidError(err.message);
        }

        if (!user.complete) {
            throw new UserProfileIncompleteError(user.id);
        }

        request.user = user;
        request.token = token;

        return true;
    }
}
