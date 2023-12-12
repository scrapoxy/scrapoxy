import {
    formatFileUnit,
    formatNumberUnit,
    formatTimeUnit, 
} from './unit';


describe(
    'unit format',
    function desc() {
        it(
            'should format number',
            () => {
                expect(formatNumberUnit())
                    .toBe('');

                const pairs: [number, string][] = [
                    [
                        0, '0',
                    ],
                    [
                        1, '1',
                    ],
                    [
                        1.1, '1',
                    ],
                    [
                        11, '11',
                    ],
                    [
                        111, '111',
                    ],
                    [
                        1111, '1.11K',
                    ],
                    [
                        11111, '11.11K',
                    ],
                    [
                        111111, '111.11K',
                    ],
                    [
                        1111111, '1.11M',
                    ],
                    [
                        11111111, '11.11M',
                    ],
                    [
                        111111111, '111.11M',
                    ],
                    [
                        1111111111, '1111.11M',
                    ],
                ];

                for (const pair of pairs) {
                    expect(formatNumberUnit(pair[ 0 ]))
                        .toBe(pair[ 1 ]);
                    expect(formatNumberUnit(
                        pair[ 0 ],
                        '/s'
                    ))
                        .toBe(`${pair[ 1 ]}/s`);
                }
            }
        );

        it(
            'should format file',
            () => {
                expect(formatFileUnit())
                    .toBe('');

                const pairs: [number, string][] = [
                    [
                        0, '0B',
                    ],
                    [
                        1, '1B',
                    ],
                    [
                        1.1, '1B',
                    ],
                    [
                        11, '11B',
                    ],
                    [
                        111, '111B',
                    ],
                    [
                        1111, '1.08KB',
                    ],
                    [
                        11111, '10.85KB',
                    ],
                    [
                        111111, '108.51KB',
                    ],
                    [
                        1111111, '1.06MB',
                    ],
                    [
                        11111111, '10.6MB',
                    ],
                    [
                        111111111, '105.96MB',
                    ],
                    [
                        1111111111, '1.03GB',
                    ],
                    [
                        11111111111, '10.35GB',
                    ],
                    [
                        111111111111, '103.48GB',
                    ],
                    [
                        1111111111111, '1.01TB',
                    ],
                    [
                        11111111111111, '10.11TB',
                    ],
                    [
                        111111111111111, '101.05TB',
                    ],
                    [
                        1111111111111111, '1010.55TB',
                    ],
                ];

                for (const pair of pairs) {
                    expect(formatFileUnit(pair[ 0 ]))
                        .toBe(pair[ 1 ]);
                    expect(formatFileUnit(
                        pair[ 0 ],
                        '/s'
                    ))
                        .toBe(`${pair[ 1 ]}/s`);
                }
            }
        );

        it(
            'should format time',
            () => {
                expect(formatNumberUnit())
                    .toBe('');

                const pairs: [number, string][] = [
                    [
                        0, '0s',
                    ],
                    [
                        1, '1s',
                    ],
                    [
                        59, '59s',
                    ],
                    [
                        60, '1m',
                    ],
                    [
                        60 * 60 - 1, '59m',
                    ],
                    [
                        60 * 60, '1h',
                    ],
                    [
                        60 * 60 * 24 - 1, '23h',
                    ],
                    [
                        60 * 60 * 24, '1d',
                    ],
                    [
                        60 * 60 * 24 * 365 - 1, '364d',
                    ],
                    [
                        60 * 60 * 24 * 365, '1y',
                    ],
                ];

                for (const pair of pairs) {
                    expect(formatTimeUnit(pair[ 0 ]))
                        .toBe(pair[ 1 ]);
                }
            }
        );
    }
);
