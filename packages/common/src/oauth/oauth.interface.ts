//////////// OAUTH ////////////
export interface IOAuthToken {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    access_token: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    refresh_token?: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    expires_in: number;
}
