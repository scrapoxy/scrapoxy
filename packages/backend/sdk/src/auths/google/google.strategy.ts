import {
    Inject,
    Injectable,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import {
    AUTH_GOOGLE_MODULE_CONFIG,
    AUTH_GOOGLE_NAME,
} from './google.constants';
import type { IAuthGoogleModuleConfig } from './google.module';
import type { IProfile } from '@scrapoxy/common';
import type {
    GoogleCallbackParameters,
    Profile,
    VerifyCallback,
} from 'passport-google-oauth20';


@Injectable()
export class GoogleStrategy extends PassportStrategy(
    Strategy,
    AUTH_GOOGLE_NAME
) {
    constructor(@Inject(AUTH_GOOGLE_MODULE_CONFIG)
        config: IAuthGoogleModuleConfig) {
        super(
            {
                clientID: config.clientID,
                clientSecret: config.clientSecret,
                callbackURL: config.callbackURL,
                scope: [
                    'profile', 'email',
                ],
            },
            function verify(
                accessToken: string,
                refreshToken: string,
                params: GoogleCallbackParameters,
                profile: Profile,
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

                if (!profile.displayName ||
                profile.displayName.length <= 0) {
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
                    id: `google|${profile.id}`,
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
