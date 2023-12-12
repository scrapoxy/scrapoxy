import {
    Inject,
    Injectable,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import {
    AUTH_LOCAL_MODULE_CONFIG,
    AUTH_LOCAL_NAME,
} from './local.constants';
import type { IAuthLocalModuleConfig } from './local.module';
import type { IProfile } from '@scrapoxy/common';
import type { IVerifyOptions } from 'passport-local';


@Injectable()
export class LocalStrategy extends PassportStrategy(
    Strategy,
    AUTH_LOCAL_NAME
) {
    constructor(@Inject(AUTH_LOCAL_MODULE_CONFIG)
        config: IAuthLocalModuleConfig) {
        super(function verify(
            username: string,
            password: string,
            done: (error: any, user?: Express.User | false, options?: IVerifyOptions) => void
        ) {
            if (!username || username.length <= 0) {
                done(
                    void 0,
                    false,
                    {
                        message: 'Missing username',
                    }
                );

                return;
            }

            if (!password || password.length <= 0) {
                done(
                    void 0,
                    false,
                    {
                        message: 'Missing password',
                    }
                );

                return;
            }

            let profileFound: IProfile;

            if (config.test) {
                profileFound = {
                    id: `local|${username}`,
                    name: username,
                    email: password,
                    picture: `http://localhost/picture/${username}`,
                };
            } else {
                if (username !== config.username ||
                    password !== config.password) {
                    done(
                        void 0,
                        false,
                        {
                            message: 'Invalid username or password',
                        }
                    );

                    return;
                }

                profileFound = {
                    id: `local|${username}`,
                    name: username,
                    email: `${username}@local`,
                    picture: null,
                };
            }

            done(
                void 0,
                profileFound
            );

            return;
        });
    }
}
