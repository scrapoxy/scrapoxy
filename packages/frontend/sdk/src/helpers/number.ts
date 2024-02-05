export function parseNumber(text: string | undefined | null): number | undefined {
    if (!text || text.length <= 0) {
        return;
    }

    if (!/^[0-9]+$/.test(text)) {
        return;
    }

    try {
        const value = parseInt(
            text,
            10
        );

        if (isNaN(value)) {
            return;
        }

        return value;
    } catch (err: any) {
        return;
    }
}
