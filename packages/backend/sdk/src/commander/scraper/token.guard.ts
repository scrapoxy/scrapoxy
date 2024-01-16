import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ProjectTokenNotFoundError } from '../../errors';
import { parseBasicFromAuthorizationHeader } from '../../helpers';
import type {
    CanActivate,
    ExecutionContext,
} from '@nestjs/common';


@Injectable()
export class CommanderScraperTokenGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const request = context.switchToHttp()
            .getRequest();
        const token = parseBasicFromAuthorizationHeader(request.headers.authorization);

        if (!token) {
            throw new ProjectTokenNotFoundError(token);
        }

        request.token = token;

        return true;
    }
}
