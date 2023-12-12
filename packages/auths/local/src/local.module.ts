import { Module } from '@nestjs/common';
import { AuthprovidersModule } from '@scrapoxy/backend-sdk';
import { AUTH_LOCAL_MODULE_CONFIG } from './local.constants';
import { AuthLocalService } from './local.service';
import { LocalStrategy } from './local.strategy';
import type { DynamicModule } from '@nestjs/common';


export interface IAuthLocalModuleConfig {
    test: boolean;
    username?: string;
    password?: string;
}

export function getEnvAuthLocalModuleConfig(): IAuthLocalModuleConfig | undefined {
    const
        password = process.env.AUTH_LOCAL_PASSWORD,
        username = process.env.AUTH_LOCAL_USERNAME;

    if (!username || username.length <= 0 ||
        !password || password.length <= 0) {
        return;
    }

    return {
        test: false,
        username,
        password,
    };
}


@Module({})
export class AuthLocalModule {
    static forRoot(config: IAuthLocalModuleConfig): DynamicModule {
        return {
            module: AuthLocalModule,
            imports: [
                AuthprovidersModule,
            ],
            providers: [
                {
                    provide: AUTH_LOCAL_MODULE_CONFIG,
                    useValue: config,
                },
                AuthLocalService,
                LocalStrategy,
            ],
            exports: [
                AuthLocalService,
            ],
        };
    }
}
