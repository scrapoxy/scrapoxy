import { sanitizeHeadersValue } from '@scrapoxy/proxy-sdk';
import type { IncomingHttpHeaders } from 'http';


const reKeyClean = new RegExp(
    '[^A-Za-z0-9\-]+',
    'g'
);


export function sanitizeHeadersKey(key: string): string {
    if (!key) {
        return key;
    }

    return key.replace(
        reKeyClean,
        ''
    );
}


export function sanitizeHeaders(h: IncomingHttpHeaders): IncomingHttpHeaders {
    if (!h) {
        return {};
    }

    const res: { [k: string]: string | string[] | undefined } = {};
    for (let [
        key, val,
    ] of Object.entries(h)) {
        key = sanitizeHeadersKey(key);

        if (key.length <= 0) {
            continue;
        }

        val = sanitizeHeadersValue(val);

        res[ key ] = val;
    }

    return res;
}
