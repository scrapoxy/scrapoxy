import {
    Injectable,
    Logger,
} from '@nestjs/common';
import { AuthNotFoundError } from '../errors';
import type { IAuthService } from '@scrapoxy/common';


@Injectable()
export class AuthprovidersService {
    private readonly logger = new Logger(AuthprovidersService.name);

    private readonly auths = new Map<string, IAuthService>();

    register(auth: IAuthService) {
        if (!auth.type || auth.type.length <= 0) {
            throw new Error('Auth type should not be empty');
        }

        if (this.auths.has(auth.type)) {
            throw new Error(`Auth ${auth.type} is already registered`);
        }

        this.logger.debug(`register(): auth.type=${auth.type}`);

        this.auths.set(
            auth.type,
            auth
        );
    }

    getAllAuths(): IAuthService[] {
        return Array.from(this.auths.values());
    }

    getAuthByType(type: string): IAuthService {
        const auth = this.auths.get(type);

        if (!auth) {
            throw new AuthNotFoundError(type);
        }

        return auth;
    }
}
