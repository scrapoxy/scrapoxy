import * as cookie from 'cookie';
import * as jwt from 'jsonwebtoken';
import type { IUserToken } from '@scrapoxy/common';
import type { Response } from 'express';
import type { IncomingHttpHeaders } from 'http';


export interface IJwtConfig {
    secret: string;
    expiration: string;
}


export const AUTH_COOKIE = 'token';


const cookieOptions = {
    httpOnly: true,
    sameSite: true,
    secure: true,
};


function rand() {
    return Math.random()
        .toString(36)
        .substring(2);
}


export function generateBasicAuthToken() {
    // Token format is user:password
    const token = `${rand()}${rand()}:${rand()}${rand()}`;

    // Always use a base64 token
    return Buffer.from(token)
        .toString('base64');
}


export function parseBasicFromAuthorizationHeader(header: string | undefined): string | undefined {
    if (!header?.startsWith('Basic ')) {
        return;
    }

    return header.substring(6);
}


function parseBearerFromAuthorizationHeader(header: string | undefined): string | undefined {
    if (!header?.startsWith('Bearer ')) {
        return;
    }

    return header.substring(7);
}


export function parserAuthFromHeaders(headers: IncomingHttpHeaders): string | undefined {
    if (headers.cookie) {
        const cookies = cookie.parse(headers.cookie);

        if (cookies?.[ AUTH_COOKIE ]) {
            return cookies[ AUTH_COOKIE ];
        }
    }

    return parseBearerFromAuthorizationHeader(headers.authorization);
}


export function addAuthCookie(
    res: Response,
    user: IUserToken,
    config: IJwtConfig
) {
    const jwtToken = jwt.sign(
        user,
        config.secret,
        {
            expiresIn: config.expiration,
        }
    );

    res.cookie(
        AUTH_COOKIE,
        jwtToken,
        cookieOptions
    );
}


export function removeAuthCookie(res: Response) {
    res.clearCookie(
        AUTH_COOKIE,
        cookieOptions
    );
}
