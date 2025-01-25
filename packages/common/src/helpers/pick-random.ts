export function pickRandom<T>(
    array: T[], count: number
): T[] {
    const copy = [
        ...array,
    ];
    const result: T[] = [];
    for (let i = 0; i < Math.min(
        count,
        array.length
    ); i++) {
        const index = Math.floor(Math.random() * copy.length);
        result.push(copy[ index ]);
        copy.splice(
            index,
            1
        );
    }

    return result;
}
