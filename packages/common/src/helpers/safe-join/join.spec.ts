import { safeJoin } from './join';


describe(
    'Failsafe join',
    () => {
        it(
            'should manage errors',
            () => {
                expect(safeJoin(void 0))
                    .toBeUndefined();

                expect(safeJoin(''))
                    .toBeUndefined();

                expect(safeJoin(null))
                    .toBeUndefined();

                expect(safeJoin(10))
                    .toBeUndefined();

                expect(safeJoin('a'))
                    .toBeUndefined();

                expect(safeJoin(true))
                    .toBeUndefined();
            }
        );

        it(
            'should manage array',
            () => {

                expect(safeJoin([
                    'a', 'b',
                ]))
                    .toBe('a,b');

                expect(safeJoin([
                    10, 20,
                ]))
                    .toBe('10,20');

                expect(safeJoin([
                    true, 20, 'a',
                ]))
                    .toBe('true,20,a');

                expect(safeJoin([
                    true,
                    20,
                    'a',
                    void 0,
                ]))
                    .toBe('true,20,a,');

                expect(safeJoin([
                    true,
                    20,
                    'a',
                    null,
                ]))
                    .toBe('true,20,a,');
            }
        );
    }
);
