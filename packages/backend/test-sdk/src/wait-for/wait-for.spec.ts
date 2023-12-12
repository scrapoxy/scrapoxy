import { waitFor } from './wait-for';


describe(
    'Wait for',
    () => {
        it(
            'should equal a simple number',
            async() => {
                const a = 10;

                await waitFor(() => {
                    expect(a)
                        .toBe(10);
                });
            }
        );

        it(
            'should not equal a simple number',
            async() => {
                const a = 10;

                await expect(waitFor(
                    () => {
                        expect(a)
                            .toBe(9);
                    },
                    5,
                    100
                ))
                    .rejects
                    .toThrow();
            }
        );

        it(
            'should equal a delayed number',
            async() => {
                let a = 10;

                setTimeout(
                    () => {
                        a = 20;
                    },
                    500
                );

                await waitFor(() => {
                    expect(a)
                        .toBe(20);
                });
            }
        );

        it(
            'should equal immediately a delayed number',
            async() => {
                let a = 10;

                setTimeout(
                    () => {
                        a = 20;
                    },
                    500
                );

                await waitFor(() => {
                    expect(a)
                        .toBe(10);
                });
            }
        );

        it(
            'should not equal a delayed number',
            async() => {
                let a = 10;

                setTimeout(
                    () => {
                        a = 20;
                    },
                    500
                );

                await expect(waitFor(
                    () => {
                        expect(a)
                            .toBe(30);
                    },
                    2,
                    600
                ))
                    .rejects
                    .toThrow();
            }
        );
    }
);
