import {
    AUTH_COOKIE,
    catchError,
} from '@scrapoxy/backend-sdk';
import {
    randomName,
    SCRAPOXY_USER_AGENT,
    toUserToken,
} from '@scrapoxy/common';
import axios from 'axios';
import * as cookie from 'cookie';
import * as jwt from 'jsonwebtoken';
import type {
    IAuthService,
    IUserToken,
    IUserToUpdate,
    IUserView,
} from '@scrapoxy/common';
import type {
    AxiosInstance,
    AxiosResponse,
} from 'axios';


export class CommanderUsersClient {
    static async generateUser(
        apiUrl: string, email?: string
    ): Promise<CommanderUsersClient> {
        const instance = axios.create({
            baseURL: `${apiUrl}/users`,
            headers: {
                'User-Agent': SCRAPOXY_USER_AGENT,
            },
        });
        instance.interceptors.response.use(
            void 0,
            (err: any) => {
                if (err.response) {
                    catchError(err.response.data);
                }

                throw err;
            }
        );

        const username = randomName();
        const res = await instance.post(
            'auths/local',
            {
                username,
                password: email ?? `${username}@localhost`,
            },
            {
                validateStatus: (status: number) => status === 200,
            }
        );
        const jwtToken = CommanderUsersClient.getJwtFromCookie(res);

        return new CommanderUsersClient(
            instance,
            jwtToken
        );
    }

    private static getJwtFromCookie(res: AxiosResponse): string {
        const setCookieHeaders = res.headers[ 'set-cookie' ] as string[];
        const cookies = cookie.parse(setCookieHeaders[ 0 ]);

        return cookies[ AUTH_COOKIE ];
    }

    private jwtTokenValue: string | undefined = void 0;

    constructor(
        private readonly instance: AxiosInstance, jwtToken: string
    ) {
        this.jwtToken = jwtToken;
    }

    get jwtToken(): string {
        if (!this.jwtTokenValue) {
            throw new Error('jwtToken not set');
        }

        return this.jwtTokenValue;
    }

    set jwtToken(value: string) {
        this.jwtTokenValue = value;
        this.instance.defaults.headers.common.Authorization = `Bearer ${value}`;
    }

    get jwtExpiration(): number {
        const payload = jwt.decode(this.jwtToken) as jwt.JwtPayload;

        return payload.exp as number;
    }

    async getAllAuths(): Promise<IAuthService[]> {
        const res = await this.instance.get<IAuthService[]>('auths');

        return res.data;
    }

    async getMe(): Promise<IUserView> {
        const res = await this.instance.get<IUserView>('me');

        return res.data;
    }

    async updateMe(userToUpdate: IUserToUpdate): Promise<IUserView> {
        const res = await this.instance.put<IUserView>(
            'me',
            userToUpdate
        );

        return res.data;
    }

    async getLogoutJwt(): Promise<string | undefined> {
        const res = await this.instance.get(
            'me/logout',
            {
                maxRedirects: 0,
                validateStatus: (status: number) => status === 302,
            }
        );

        return CommanderUsersClient.getJwtFromCookie(res);
    }

    changeJwtExpiration(
        secret: string, newExpiration: string
    ) {
        const payload = jwt.verify(
            this.jwtToken,
            secret
        ) as IUserToken;
        const newPayload = toUserToken(payload);

        this.jwtToken = jwt.sign(
            newPayload,
            secret,
            {
                expiresIn: newExpiration,
            }
        );
    }

    async renewJwt() {
        const res = await this.instance.get(
            'me/renew',
            {
                maxRedirects: 0,
                validateStatus: (status: number) => status === 302,
            }
        );

        this.jwtToken = CommanderUsersClient.getJwtFromCookie(res);
    }
}
