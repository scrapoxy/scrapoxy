import {
    Inject,
    Injectable,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import {
    AUTH_GITHUB_MODULE_CONFIG,
    AUTH_GITHUB_NAME,
} from './github.constants';
import type { IProfileGithub } from './github.interface';
import type { IAuthGithubModuleConfig } from './github.module';
import type { IProfile } from '@scrapoxy/common';
import type { VerifyCallback } from 'passport-oauth2';


@Injectable()
export class GithubStrategy extends PassportStrategy(
    Strategy,
    AUTH_GITHUB_NAME
) {
    constructor(@Inject(AUTH_GITHUB_MODULE_CONFIG)
        config: IAuthGithubModuleConfig) {
        super(
            {
                clientID: config.clientID,
                clientSecret: config.clientSecret,
                callbackURL: config.callbackURL,
            },
            function verify(
                accessToken: string,
                refreshToken: string,
                results: any,
                profile: IProfileGithub,
                done: VerifyCallback
            ) {
                if (!profile) {
                    done(
                        void 0,
                        false,
                        {
                            message: 'Missing profile',
                        }
                    );

                    return;
                }

                if (!profile.id || profile.id.length <= 0) {
                    done(
                        void 0,
                        false,
                        {
                            message: 'Missing ID',
                        }
                    );

                    return;
                }

                if (!profile.displayName || profile.displayName.length <= 0) {
                    done(
                        void 0,
                        false,
                        {
                            message: 'Missing displayName',
                        }
                    );

                    return;
                }

                let email: string | null;

                if (profile.emails && profile.emails.length > 0) {
                    email = profile.emails[ 0 ].value;
                } else {
                    email = null;
                }

                let picture: string | null;

                if (profile.photos && profile.photos.length > 0) {
                    picture = profile.photos[ 0 ].value;
                } else {
                    picture = null;
                }

                const profileFound: IProfile = {
                    id: `github|${profile.id}`,
                    name: profile.displayName,
                    email,
                    picture,
                };

                done(
                    void 0,
                    profileFound
                );
            }
        );
    }
}
