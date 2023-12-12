import { parseDomain } from './domain';


describe(
    'Parse Domain',
    () => {
        it(
            'should not accept empty domain',
            () => {
                expect(parseDomain(void 0))
                    .toBeUndefined();

                expect(parseDomain(''))
                    .toBeUndefined();

                expect(parseDomain('.'))
                    .toBeUndefined();
            }
        );

        it(
            'should parse a domain',
            () => {
                expect(parseDomain('example.com.'))
                    .toBe('example.com');

                expect(parseDomain('example.com'))
                    .toBe('example.com');

                expect(parseDomain('.example.com'))
                    .toBe('example.com');
            }
        );

        it(
            'should parse a root domain',
            () => {
                expect(parseDomain('com.'))
                    .toBe('com');

                expect(parseDomain('com'))
                    .toBe('com');

                expect(parseDomain('.com'))
                    .toBe('com');
            }
        );

        it(
            'should parse a domain with subdomain',
            () => {
                expect(parseDomain('my.example.com'))
                    .toBe('example.com');

                expect(parseDomain('.my.example.com'))
                    .toBe('example.com');

                expect(parseDomain('sub.my.example.com'))
                    .toBe('example.com');
            }
        );
    }
);
