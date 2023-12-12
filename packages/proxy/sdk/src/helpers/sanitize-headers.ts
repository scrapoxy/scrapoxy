const reValClean = new RegExp(
    '[\r\n]',
    'g'
);


export function sanitizeHeadersValue(value: string | string[] | undefined): string | string[] | undefined {
    if (!value) {
        return value;
    }

    if (Array.isArray(value)) {
        const newValue: string[] = [];
        for (const item of value) {
            newValue.push(item.replace(
                reValClean,
                ''
            ));
        }

        return newValue;
    }

    return value.replace(
        reValClean,
        ''
    );
}
