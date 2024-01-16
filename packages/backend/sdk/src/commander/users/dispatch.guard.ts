import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { AuthprovidersService } from '../../auths';
import { AuthNotFoundError } from '../../errors';
import type {
    CanActivate,
    ExecutionContext,
} from '@nestjs/common';


@Injectable()
export class CommanderUsersDispatchGuard implements CanActivate {
    constructor(private readonly authproviders: AuthprovidersService) {}

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const request = context.switchToHttp()
            .getRequest();
        const type = request.params.type;

        if (!type) {
            throw new AuthNotFoundError();
        }

        const auth = this.authproviders.getAuthByType(type);
        const guardType = AuthGuard(auth.type);
        const guard = new guardType();
        const activate = guard.canActivate(context);

        return activate;
    }
}
