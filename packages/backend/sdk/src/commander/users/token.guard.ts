import {
    Inject,
    Injectable,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { Observable } from 'rxjs';
import { COMMANDER_USERS_MODULE_CONFIG } from './users.constants';
import { JwtInvalidError } from '../../errors';
import { parserAuthFromHeaders } from '../../helpers';
import type { ICommanderUsersModuleConfig } from './users.module';
import type {
    CanActivate,
    ExecutionContext,
} from '@nestjs/common';
import type { IUserToken } from '@scrapoxy/common';


@Injectable()
export class CommanderUsersTokenGuard implements CanActivate {
    constructor(@Inject(COMMANDER_USERS_MODULE_CONFIG)
    private readonly config: ICommanderUsersModuleConfig) {}

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const request = context.switchToHttp()
            .getRequest();
        const token = parserAuthFromHeaders(request.headers);

        if (!token) {
            throw new JwtInvalidError('JWT missing');
        }

        try {
            request.user = jwt.verify(
                token,
                this.config.jwt.secret
            ) as IUserToken;

            request.token = token;

            return true;
        } catch (err: any) {
            throw new JwtInvalidError(err.message);
        }
    }
}
