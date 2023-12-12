import {
    Inject,
    Injectable,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { Observable } from 'rxjs';
import { COMMANDER_REFRESH_MODULE_CONFIG } from './refresh.constants';
import { JwtInvalidError } from '../../commander-client';
import { parserAuthFromHeaders } from '../../helpers';
import type { ICommanderRefreshModuleConfig } from './refresh.module';
import type {
    CanActivate,
    ExecutionContext,
} from '@nestjs/common';


@Injectable()
export class CommanderRefreshTokenGuard implements CanActivate {
    constructor(@Inject(COMMANDER_REFRESH_MODULE_CONFIG)
    private readonly config: ICommanderRefreshModuleConfig) {}

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const request = context.switchToHttp()
            .getRequest();
        const token = parserAuthFromHeaders(request.headers);

        if (!token) {
            throw new JwtInvalidError('JWT missing');
        }

        try {
            jwt.verify(
                token,
                this.config.jwtSecret
            );
            request.token = token;
        } catch (err: any) {
            throw new JwtInvalidError(err.message);
        }

        return true;
    }
}
