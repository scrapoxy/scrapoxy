export function parseConnectUrl(url: string | undefined): { hostname: string; port: number } {
    if (!url) {
        throw new Error('No URL found');
    }

    const part = url.split(':');

    if (part.length !== 2) {
        throw new Error(`Cannot parse target: ${url}`);
    }

    const hostname = part[ 0 ],
        port = parseInt(part[ 1 ]);

    if (!hostname || !port) {
        throw new Error(`Cannot parse target (2): ${url}`);
    }

    return {
        hostname, port,
    };
}
