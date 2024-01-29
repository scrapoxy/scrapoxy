import { Module } from '@nestjs/common';
import { AUTH_GITHUB_MODULE_CONFIG } from './github.constants';
import { AuthGithubService } from './github.service';
import { GithubStrategy } from './github.strategy';
import { AuthprovidersModule } from '../providers.module';
import type { DynamicModule } from '@nestjs/common';


export interface IAuthGithubModuleConfig {
    clientID: string | undefined;
    clientSecret: string | undefined;
    callbackURL: string;
}


export function getEnvAuthGithubModuleConfig(frontendUrl: string): IAuthGithubModuleConfig | undefined {
    const
        clientID = process.env.AUTH_GITHUB_CLIENT_ID,
        clientSecret = process.env.AUTH_GITHUB_CLIENT_SECRET;

    if (!clientID || clientID.length <= 0 ||
        !clientSecret || clientSecret.length <= 0) {
        return;
    }

    return {
        clientID,
        clientSecret,
        callbackURL: process.env.AUTH_GITHUB_CALLBACK_URL ?? `${frontendUrl}/api/users/auths/github`,
    };
}


@Module({})
export class AuthGithubModule {
    static forRoot(config: IAuthGithubModuleConfig): DynamicModule {
        return {
            module: AuthGithubModule,
            imports: [
                AuthprovidersModule,
            ],
            providers: [
                {
                    provide: AUTH_GITHUB_MODULE_CONFIG,
                    useValue: config,
                },
                AuthGithubService,
                GithubStrategy,
            ],
            exports: [
                AuthGithubService,
            ],
        };
    }
}
