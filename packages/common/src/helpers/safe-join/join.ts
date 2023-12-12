export function safeJoin(
    array: any, sep = ','
): string | undefined {
    try {
        if (!Array.isArray(array)) {
            return;
        }

        return array.join(sep);
    } catch (err: any) {
        return;
    }
}
