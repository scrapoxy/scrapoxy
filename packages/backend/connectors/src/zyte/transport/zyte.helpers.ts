export function parseApiUrl(url: string | undefined | null): { hostname: string; port: number } {
    if (!url || url.length <= 0) {
        throw new Error('URL is empty');
    }

    const arr = url.split(':');

    if (arr.length !== 2) {
        throw new Error('URL is invalid');
    }

    try {
        return {
            hostname: arr[ 0 ],
            port: parseInt(
                arr[ 1 ],
                10
            ),
        };
    } catch (err: any) {
        throw new Error('Port is invalid');
    }
}
