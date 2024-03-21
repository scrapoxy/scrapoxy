export function capitalize(str: string): string {
    if (!str || str.length <= 0) {
        return str;
    }

    return str.charAt(0)
        .toUpperCase() + str.slice(1);
}
