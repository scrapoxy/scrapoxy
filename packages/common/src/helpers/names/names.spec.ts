import { getFreename } from './names';


describe(
    'Free name',
    () => {
        it(
            'should get a free name',
            () => {
                expect(getFreename(
                    'my connector',
                    []
                ))
                    .toBe('my connector');

                expect(getFreename(
                    'my connector',
                    [
                        'my connector',
                    ]
                ))
                    .toBe('my connector 2');

                expect(getFreename(
                    'my connector',
                    [
                        'my connector 2',
                    ]
                ))
                    .toBe('my connector');

                expect(getFreename(
                    'my connector',
                    [
                        'my connector', 'my connector 2',
                    ]
                ))
                    .toBe('my connector 3');

                expect(getFreename(
                    'my connector',
                    [
                        'my connector', 'my connector 2', 'my connector 3',
                    ]
                ))
                    .toBe('my connector 4');

                expect(getFreename(
                    'my connector',
                    [
                        'my connector', 'my connector 3',
                    ]
                ))
                    .toBe('my connector 2');
            }
        );
    }
);
