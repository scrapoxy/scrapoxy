import { parseFreeproxy } from './freeproxy.helpers';
import { EFreeproxyType } from '../freeproxies';
import type { IFreeproxyBase } from '../freeproxies';


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

                expect(parseFreeproxy('myhostname:fakeport'))
                    .toBeUndefined();
            }
        );

        it(
            'should parse hostname and/or port',
            () => {
                expect(parseFreeproxy('myhostname:1234'))
                    .toEqual({
                        type: EFreeproxyType.HTTP,
                        key: 'myhostname:1234',
                        address: {
                            hostname: 'myhostname',
                            port: 1234,
                        },
                        auth: null,
                    } as IFreeproxyBase);

                expect(parseFreeproxy('myhostname:2'))
                    .toEqual({
                        type: EFreeproxyType.HTTP,
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
                        type: EFreeproxyType.HTTP,
                        key: 'myhostname:1234',
                        address: {
                            hostname: 'myhostname',
                            port: 1234,
                        },
                        auth: null,
                    } as IFreeproxyBase);

                expect(parseFreeproxy('https://myhostname:1234'))
                    .toEqual({
                        type: EFreeproxyType.HTTPS,
                        key: 'myhostname:1234',
                        address: {
                            hostname: 'myhostname',
                            port: 1234,
                        },
                        auth: null,
                    } as IFreeproxyBase);

                expect(parseFreeproxy('socks://myhostname:1234'))
                    .toEqual({
                        type: EFreeproxyType.SOCKS,
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
                expect(parseFreeproxy('http://mylogin:mypassword@myhostname:1234'))
                    .toEqual({
                        type: EFreeproxyType.HTTP,
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
                        type: EFreeproxyType.HTTPS,
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
                        type: EFreeproxyType.HTTPS,
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

                expect(parseFreeproxy('socks://:mypassword@myhostname:1234'))
                    .toEqual({
                        type: EFreeproxyType.SOCKS,
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

                expect(parseFreeproxy('socks://mylogin:mypassword:mypassword2@myhostname:1234'))
                    .toEqual({
                        type: EFreeproxyType.SOCKS,
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
