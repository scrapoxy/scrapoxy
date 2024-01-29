import { Module } from '@nestjs/common';
import { AUTH_GOOGLE_MODULE_CONFIG } from './google.constants';
import { AuthGoogleService } from './google.service';
import { GoogleStrategy } from './google.strategy';
import { AuthprovidersModule } from '../providers.module';
import type { DynamicModule } from '@nestjs/common';


export interface IAuthGoogleModuleConfig {
    clientID: string | undefined;
    clientSecret: string | undefined;
    callbackURL: string;
}


export function getEnvAuthGoogleModuleConfig(frontendUrl: string): IAuthGoogleModuleConfig | undefined {
    const
        clientID = process.env.AUTH_GOOGLE_CLIENT_ID,
        clientSecret = process.env.AUTH_GOOGLE_CLIENT_SECRET;

    if (!clientID || clientID.length <= 0 ||
        !clientSecret || clientSecret.length <= 0) {
        return;
    }

    return {
        clientID,
        clientSecret,
        callbackURL: process.env.AUTH_GOOGLE_CALLBACK_URL ?? `${frontendUrl}/api/users/auths/google`,
    };
}


@Module({})
export class AuthGoogleModule {
    static forRoot(config: IAuthGoogleModuleConfig): DynamicModule {
        return {
            module: AuthGoogleModule,
            imports: [
                AuthprovidersModule,
            ],
            providers: [
                {
                    provide: AUTH_GOOGLE_MODULE_CONFIG,
                    useValue: config,
                },
                AuthGoogleService,
                GoogleStrategy,
            ],
            exports: [
                AuthGoogleService,
            ],
        };
    }
}
