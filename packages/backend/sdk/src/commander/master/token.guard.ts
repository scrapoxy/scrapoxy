import {
    Inject,
    Injectable,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { Observable } from 'rxjs';
import { COMMANDER_MASTER_MODULE_CONFIG } from './master.constants';
import {
    JwtInvalidError,
    ProjectTokenNotFoundError,
} from '../../commander-client';
import {
    parseBasicFromAuthorizationHeader,
    parserAuthFromHeaders,
} from '../../helpers';
import type { ICommanderMasterModuleConfig } from './master.module';
import type {
    CanActivate,
    ExecutionContext,
} from '@nestjs/common';


@Injectable()
export class CommanderProjectMasterTokenGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const request = context.switchToHttp()
            .getRequest();
        const token = parseBasicFromAuthorizationHeader(request.headers[ 'proxy-authorization' ]);

        if (!token) {
            throw new ProjectTokenNotFoundError(token);
        }

        request.token = token;

        return true;
    }
}

@Injectable()
export class CommanderMasterTokenGuard implements CanActivate {
    constructor(@Inject(COMMANDER_MASTER_MODULE_CONFIG)
    private readonly config: ICommanderMasterModuleConfig) {}

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
