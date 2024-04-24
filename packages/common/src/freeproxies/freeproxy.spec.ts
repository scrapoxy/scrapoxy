import { parseFreeproxy } from './freeproxy.helpers';
import { EProxyType } from '../proxies/proxy.interface';
import type { IFreeproxyBase } from './freeproxy.interface';


describe(
    'Parse free proxy',
    () => {
        it(
            'should manage errors',
            () => {
                expect(parseFreeproxy(void 0))
                    .toBeUndefined();

                expect(parseFreeproxy(''))
                    .toBeUndefined();

                expect(parseFreeproxy(null))
                    .toBeUndefined();

                expect(parseFreeproxy('myhostname'))
                    .toBeUndefined();

                expect(parseFreeproxy('unknown://myhostname'))
                    .toBeUndefined();

                expect(parseFreeproxy('myhostname:-1'))
                    .toBeUndefined();

                expect(parseFreeproxy('myhostname:0'))
                    .toBeUndefined();

                expect(parseFreeproxy('myhostname:65536'))
                    .toBeUndefined();

                expect(parseFreeproxy('myhostname:1234:4'))
                    .toBeUndefined();

                expect(parseFreeproxy('myhostname:1234:username:password:other'))
                    .toBeUndefined();

                expect(parseFreeproxy('myhostname:fakeport'))
                    .toBeUndefined();
            }
        );

        it(
            'should parse hostname and/or port',
            () => {
                expect(parseFreeproxy('myhostname:1234'))
                    .toEqual({
                        type: EProxyType.HTTP,
                        key: 'myhostname:1234',
                        address: {
                            hostname: 'myhostname',
                            port: 1234,
                        },
                        auth: null,
                    } as IFreeproxyBase);

                expect(parseFreeproxy('myhostname:2'))
                    .toEqual({
                        type: EProxyType.HTTP,
                        key: 'myhostname:2',
                        address: {
                            hostname: 'myhostname',
                            port: 2,
                        },
                        auth: null,
                    } as IFreeproxyBase);
            }
        );

        it(
            'should parse protocol',
            () => {
                expect(parseFreeproxy('http://myhostname:1234'))
                    .toEqual({
                        type: EProxyType.HTTP,
                        key: 'myhostname:1234',
                        address: {
                            hostname: 'myhostname',
                            port: 1234,
                        },
                        auth: null,
                    } as IFreeproxyBase);

                expect(parseFreeproxy('https://myhostname:1234'))
                    .toEqual({
                        type: EProxyType.HTTPS,
                        key: 'myhostname:1234',
                        address: {
                            hostname: 'myhostname',
                            port: 1234,
                        },
                        auth: null,
                    } as IFreeproxyBase);

                expect(parseFreeproxy('socks4://myhostname:1234'))
                    .toEqual({
                        type: EProxyType.SOCKS4,
                        key: 'myhostname:1234',
                        address: {
                            hostname: 'myhostname',
                            port: 1234,
                        },
                        auth: null,
                    } as IFreeproxyBase);
            }
        );

        it(
            'should parse auth',
            () => {
                expect(parseFreeproxy('myhostname:1234:mylogin:mypassword'))
                    .toEqual({
                        type: EProxyType.HTTP,
                        key: 'myhostname:1234',
                        address: {
                            hostname: 'myhostname',
                            port: 1234,
                        },
                        auth: {
                            username: 'mylogin',
                            password: 'mypassword',
                        },
                    } as IFreeproxyBase);

                expect(parseFreeproxy('http://mylogin:mypassword@myhostname:1234'))
                    .toEqual({
                        type: EProxyType.HTTP,
                        key: 'myhostname:1234',
                        address: {
                            hostname: 'myhostname',
                            port: 1234,
                        },
                        auth: {
                            username: 'mylogin',
                            password: 'mypassword',
                        },
                    } as IFreeproxyBase);

                expect(parseFreeproxy('https://mylogin:@myhostname:1234'))
                    .toEqual({
                        type: EProxyType.HTTPS,
                        key: 'myhostname:1234',
                        address: {
                            hostname: 'myhostname',
                            port: 1234,
                        },
                        auth: {
                            username: 'mylogin',
                            password: '',
                        },
                    } as IFreeproxyBase);

                expect(parseFreeproxy('https://mylogin@myhostname:1234'))
                    .toEqual({
                        type: EProxyType.HTTPS,
                        key: 'myhostname:1234',
                        address: {
                            hostname: 'myhostname',
                            port: 1234,
                        },
                        auth: {
                            username: 'mylogin',
                            password: '',
                        },
                    } as IFreeproxyBase);

                expect(parseFreeproxy('socks5://:mypassword@myhostname:1234'))
                    .toEqual({
                        type: EProxyType.SOCKS5,
                        key: 'myhostname:1234',
                        address: {
                            hostname: 'myhostname',
                            port: 1234,
                        },
                        auth: {
                            username: '',
                            password: 'mypassword',
                        },
                    } as IFreeproxyBase);

                expect(parseFreeproxy('socks5://mylogin:mypassword:mypassword2@myhostname:1234'))
                    .toEqual({
                        type: EProxyType.SOCKS5,
                        key: 'myhostname:1234',
                        address: {
                            hostname: 'myhostname',
                            port: 1234,
                        },
                        auth: {
                            username: 'mylogin',
                            password: 'mypassword:mypassword2',
                        },
                    } as IFreeproxyBase);
            }
        );
    }
);
