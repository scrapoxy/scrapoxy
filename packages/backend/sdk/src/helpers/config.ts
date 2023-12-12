import { resolve } from 'path';
import type { IJwtConfig } from './token';


export function getEnvAssetsPath(): string {
    let assetsPath = process.env.ASSETS_PATH;

    if (!assetsPath) {
        assetsPath = resolve(
            __dirname,
            'assets'
        );
    }

    return assetsPath;
}


export function getEnvFrontendJwtConfig(): IJwtConfig {
    const secret = process.env.FRONTEND_JWT_SECRET;

    if (!secret) {
        throw new Error('FRONTEND_JWT_SECRET is not set');
    }

    return {
        secret,
        expiration: process.env.FRONTEND_JWT_EXPIRATION ?? '24h',
    };
}


export function getEnvBackendJwtConfig(): IJwtConfig {
    const secret = process.env.BACKEND_JWT_SECRET;

    if (!secret) {
        throw new Error('BACKEND_JWT_SECRET is not set');
    }

    return {
        secret,
        expiration: process.env.BACKEND_JWT_EXPIRATION ?? '60s',
    };
}
