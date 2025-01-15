export function toTitleCase(str: string | undefined): string | undefined {
    if (!str) {
        return str;
    }

    return str.replace(
        /\w\S*/g,
        text => text.charAt(0)
            .toUpperCase() + text.substring(1)
            .toLowerCase()
    );
}
