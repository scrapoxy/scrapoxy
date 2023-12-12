import { sanitizeHeaders } from './sanitize';
import type { IncomingHttpHeaders } from 'http';


describe(
    'request headers transformation',
    function desc() {
        it(
            'should correct headers',
            () => {
                const badHeaders: IncomingHttpHeaders = {
                    '': 'header0',
                    'p3p ': 'header1',
                    ' aze': 'header2',
                    ' aze-sdf-aze': 'header3',
                    ' #aze #12': 'header4',
                    'X-Normal-Header': 'header5',
                    '\u0001key': 'header6',
                    key2: '\u0001hea\u0001der7',
                    '\rkey3': '\r\nheader8',
                    'key\r\n4': 'h e a d e r\r\n 9\r\n',
                    key5: '',
                    key7: void 0,
                    key8: [
                        'header\r\n10', 'header11',
                    ],
                };
                const goodHeaders = {
                    p3p: 'header1',
                    aze: 'header2',
                    'aze-sdf-aze': 'header3',
                    aze12: 'header4',
                    'X-Normal-Header': 'header5',
                    key: 'header6',
                    key2: '\u0001hea\u0001der7',
                    key3: 'header8',
                    key4: 'h e a d e r 9',
                    key5: '',
                    key7: void 0,
                    key8: [
                        'header10', 'header11',
                    ],
                };
                const expected = sanitizeHeaders(badHeaders);
                expect(expected)
                    .toEqual(goodHeaders);
            }
        );
    }
);
