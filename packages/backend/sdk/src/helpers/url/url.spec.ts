import {
    isUrl,
    urlOptionsToUrl,
    urlToUrlOptions,
} from './url';


describe(
    'Parse URL',
    () => {
        it(
            'should not accept url without protocol',
            () => {
                expect(urlToUrlOptions('scrapoxy.io'))
                    .toBeUndefined();
            }
        );

        it(
            'should parse a simple url',
            () => {
                expect(urlToUrlOptions('http://scrapoxy.io'))
                    .toEqual({
                        protocol: 'http:',
                        username: void 0,
                        password: void 0,
                        hostname: 'scrapoxy.io',
                        port: 80,
                        pathname: '/',
                        search: void 0,
                        hash: void 0,
                    });
            }
        );

        it(
            'should parse duplicate port information in a url',
            () => {
                expect(urlToUrlOptions('http://scrapoxy.io:80'))
                    .toEqual({
                        protocol: 'http:',
                        username: void 0,
                        password: void 0,
                        hostname: 'scrapoxy.io',
                        port: 80,
                        pathname: '/',
                        search: void 0,
                        hash: void 0,
                    });
            }
        );

        it(
            'should parse port in a http url',
            () => {
                expect(urlToUrlOptions('http://scrapoxy.io:443'))
                    .toEqual({
                        protocol: 'http:',
                        username: void 0,
                        password: void 0,
                        hostname: 'scrapoxy.io',
                        port: 443,
                        pathname: '/',
                        search: void 0,
                        hash: void 0,
                    });
            }
        );

        it(
            'should parse port in a https url',
            () => {
                expect(urlToUrlOptions('https://scrapoxy.io:80'))
                    .toEqual({
                        protocol: 'https:',
                        username: void 0,
                        password: void 0,
                        hostname: 'scrapoxy.io',
                        port: 80,
                        pathname: '/',
                        search: void 0,
                        hash: void 0,
                    });
            }
        );

        it(
            'should parse a username in a url',
            () => {
                expect(urlToUrlOptions('http://john@scrapoxy.io:443'))
                    .toEqual({
                        protocol: 'http:',
                        username: 'john',
                        password: void 0,
                        hostname: 'scrapoxy.io',
                        port: 443,
                        pathname: '/',
                        search: void 0,
                        hash: void 0,
                    });
            }
        );

        it(
            'should parse a password in a url',
            () => {
                expect(urlToUrlOptions('http://:123@scrapoxy.io'))
                    .toEqual({
                        protocol: 'http:',
                        username: void 0,
                        password: '123',
                        hostname: 'scrapoxy.io',
                        port: 80,
                        pathname: '/',
                        search: void 0,
                        hash: void 0,
                    });
            }
        );

        it(
            'should parse a username and password in a url',
            () => {
                expect(urlToUrlOptions('http://john:123@scrapoxy.io'))
                    .toEqual({
                        protocol: 'http:',
                        username: 'john',
                        password: '123',
                        hostname: 'scrapoxy.io',
                        port: 80,
                        pathname: '/',
                        search: void 0,
                        hash: void 0,
                    });
            }
        );

        it(
            'should parse a pathname in a url',
            () => {
                expect(urlToUrlOptions('http://john:123@scrapoxy.io/blog/index/1'))
                    .toEqual({
                        protocol: 'http:',
                        username: 'john',
                        password: '123',
                        hostname: 'scrapoxy.io',
                        port: 80,
                        pathname: '/blog/index/1',
                        search: void 0,
                        hash: void 0,
                    });
            }
        );

        it(
            'should parse a search in a url',
            () => {
                expect(urlToUrlOptions('http://scrapoxy.io?index=44&page=33'))
                    .toEqual({
                        protocol: 'http:',
                        username: void 0,
                        password: void 0,
                        hostname: 'scrapoxy.io',
                        port: 80,
                        pathname: '/',
                        search: '?index=44&page=33',
                        hash: void 0,
                    });
            }
        );

        it(
            'should parse a pathname and a search in a url',
            () => {
                expect(urlToUrlOptions('http://scrapoxy.io/index/blog?index=44&page=33'))
                    .toEqual({
                        protocol: 'http:',
                        username: void 0,
                        password: void 0,
                        hostname: 'scrapoxy.io',
                        port: 80,
                        pathname: '/index/blog',
                        search: '?index=44&page=33',
                        hash: void 0,
                    });
            }
        );

        it(
            'should parse a pathname and a search with a hash in a url',
            () => {
                expect(urlToUrlOptions('http://scrapoxy.io/index/blog?index=44&page=33#my'))
                    .toEqual({
                        protocol: 'http:',
                        username: void 0,
                        password: void 0,
                        hostname: 'scrapoxy.io',
                        port: 80,
                        pathname: '/index/blog',
                        search: '?index=44&page=33',
                        hash: '#my',
                    });
            }
        );
    }
);


describe(
    'Format URL',
    () => {
        it(
            'should format a simple url',
            () => {
                expect(urlOptionsToUrl({
                    protocol: 'http:',
                    username: void 0,
                    password: void 0,
                    hostname: 'scrapoxy.io',
                    port: 80,
                    pathname: '/',
                    search: void 0,
                    hash: void 0,
                }))
                    .toBe('http://scrapoxy.io/');
            }
        );

        it(
            'should format a port in a http url',
            () => {
                expect(urlOptionsToUrl({
                    protocol: 'http:',
                    username: void 0,
                    password: void 0,
                    hostname: 'scrapoxy.io',
                    port: 443,
                    pathname: '/',
                    search: void 0,
                    hash: void 0,
                }))
                    .toBe('http://scrapoxy.io:443/');
            }
        );

        it(
            'should format a port in a https url',
            () => {
                expect(urlOptionsToUrl({
                    protocol: 'https:',
                    username: void 0,
                    password: void 0,
                    hostname: 'scrapoxy.io',
                    port: 80,
                    pathname: '/',
                    search: void 0,
                    hash: void 0,
                }))
                    .toBe('https://scrapoxy.io:80/');
            }
        );

        it(
            'should format a username in a url',
            () => {
                expect(urlOptionsToUrl({
                    protocol: 'http:',
                    username: 'john',
                    password: void 0,
                    hostname: 'scrapoxy.io',
                    port: 443,
                    pathname: '/',
                    search: void 0,
                    hash: void 0,
                }))
                    .toBe('http://john@scrapoxy.io:443/');
            }
        );

        it(
            'should format a password in a url',
            () => {
                expect(urlOptionsToUrl({
                    protocol: 'http:',
                    username: void 0,
                    password: '123',
                    hostname: 'scrapoxy.io',
                    port: 80,
                    pathname: '/',
                    search: void 0,
                    hash: void 0,
                }))
                    .toBe('http://:123@scrapoxy.io/');
            }
        );

        it(
            'should format a username and password in a url',
            () => {
                expect(urlOptionsToUrl({
                    protocol: 'http:',
                    username: 'john',
                    password: '123',
                    hostname: 'scrapoxy.io',
                    port: 80,
                    pathname: '/',
                    search: void 0,
                    hash: void 0,
                }))
                    .toBe('http://john:123@scrapoxy.io/');
            }
        );

        it(
            'should format a pathname in a url',
            () => {
                expect(urlOptionsToUrl({
                    protocol: 'http:',
                    username: 'john',
                    password: '123',
                    hostname: 'scrapoxy.io',
                    port: 80,
                    pathname: '/blog/index/1',
                    search: void 0,
                    hash: void 0,
                }))
                    .toBe('http://john:123@scrapoxy.io/blog/index/1');
            }
        );

        it(
            'should format a search in a url',
            () => {
                expect(urlOptionsToUrl({
                    protocol: 'http:',
                    username: void 0,
                    password: void 0,
                    hostname: 'scrapoxy.io',
                    port: 80,
                    pathname: '/',
                    search: '?index=44&page=33',
                    hash: void 0,
                }))
                    .toBe('http://scrapoxy.io/?index=44&page=33');
            }
        );

        it(
            'should format a pathname and a search in a url',
            () => {
                expect(urlOptionsToUrl({
                    protocol: 'http:',
                    username: void 0,
                    password: void 0,
                    hostname: 'scrapoxy.io',
                    port: 80,
                    pathname: '/index/blog',
                    search: '?index=44&page=33',
                    hash: void 0,
                }))
                    .toBe('http://scrapoxy.io/index/blog?index=44&page=33');
            }
        );

        it(
            'should format a pathname and a search with a hash in a url',
            () => {
                expect(urlOptionsToUrl({
                    protocol: 'http:',
                    username: void 0,
                    password: void 0,
                    hostname: 'scrapoxy.io',
                    port: 80,
                    pathname: '/index/blog',
                    search: '?index=44&page=33',
                    hash: '#my',
                }))
                    .toBe('http://scrapoxy.io/index/blog?index=44&page=33#my');
            }
        );

        it(
            'should format a pathname and a search with a hash in a url without hostname',
            () => {
                expect(urlOptionsToUrl(
                    {
                        protocol: 'http:',
                        username: void 0,
                        password: void 0,
                        hostname: 'scrapoxy.io',
                        port: 80,
                        pathname: '/index/blog',
                        search: '?index=44&page=33',
                        hash: '#my',
                    },
                    false
                ))
                    .toBe('/index/blog?index=44&page=33#my');
            }
        );

        it(
            'should format a search in a url without hostname',
            () => {
                expect(urlOptionsToUrl(
                    {
                        protocol: 'http:',
                        username: void 0,
                        password: void 0,
                        hostname: 'scrapoxy.io',
                        port: 80,
                        pathname: '/',
                        search: '?index=44&page=33',
                        hash: void 0,
                    },
                    false
                ))
                    .toBe('/?index=44&page=33');
            }
        );
    }
);


describe(
    'URL format validation',
    () => {
        it(
            'should be an URL',
            () => {
                // Domain
                expect(isUrl('domain'))
                    .toBeTruthy();
                expect(isUrl('domain.com'))
                    .toBeTruthy();

                // IPv4 like
                expect(isUrl('0.0.0.ip'))
                    .toBeTruthy();
                expect(isUrl('0.0.0.0-ip'))
                    .toBeTruthy();
                expect(isUrl('0-ip.0.0.0'))
                    .toBeTruthy();
                expect(isUrl('A.0.0.0'))
                    .toBeTruthy();
                expect(isUrl('0.A.0.0'))
                    .toBeTruthy();
                expect(isUrl('0.0.A.0'))
                    .toBeTruthy();
                expect(isUrl('0.0.0.A'))
                    .toBeTruthy();
                expect(isUrl('1.2.3.4.5'))
                    .toBeTruthy();
                expect(isUrl('1.2.3.4.5'))
                    .toBeTruthy();
                expect(isUrl('256.0.0.0'))
                    .toBeTruthy();

                // IPv6 like
                expect(isUrl('2001:0000:130F:0000:0000:09C0:876A:130B:130B'))
                    .toBeTruthy();
                expect(isUrl('2001:0000:130F:0000:0000:09C0:876X:130B'))
                    .toBeTruthy();
                expect(isUrl('2001:0000:130F:0000:0000:09C0:876A-ok:130B'))
                    .toBeTruthy();
            }
        );

        it(
            'should not be an URL',
            () => {
                // Empty
                expect(isUrl(void 0))
                    .toBeFalsy();
                expect(isUrl(null))
                    .toBeFalsy();
                expect(isUrl(''))
                    .toBeFalsy();
                expect(isUrl(' '))
                    .toBeFalsy();

                // IPv4
                expect(isUrl('1.2.3.4'))
                    .toBeFalsy();

                // IPv6
                expect(isUrl('2001:0000:130F:0000:0000:09C0:876A:130B'))
                    .toBeFalsy();
            }
        );
    }
);
