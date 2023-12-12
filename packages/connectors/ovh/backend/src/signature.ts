import { createHash } from 'crypto';
import { stringify } from 'querystring';
import type { InternalAxiosRequestConfig } from 'axios';


function formatBody(body: any): string {
    if (!body) {
        return '';
    }

    return JSON
        .stringify(body)
        .replace(
            /[\u0080-\uFFFF]/g,
            (m) => '\\u' + ('0000' + m.charCodeAt(0)
                .toString(16)).slice(-4)
        );
}


export class OvhSignature {
    constructor(
        private readonly appKey: string,
        private readonly appSecret: string,
        private readonly consumerKey: string
    ) {
    }

    sign(config: InternalAxiosRequestConfig) {
        let url: string;

        if (config.params) {
            url = `${config.baseURL}/${config.url}?${stringify(config.params)}`;
        } else {
            url = `${config.baseURL}/${config.url}`;
        }

        config.headers[ 'Content-Type' ] = 'application/json';
        config.headers[ 'X-Ovh-Application' ] = this.appKey;
        config.headers[ 'X-Ovh-Consumer' ] = this.consumerKey;

        const timestamp = Math.round(Date.now() / 1000);
        config.headers[ 'X-Ovh-Timestamp' ] = timestamp;

        const payload = [
            this.appSecret,
            this.consumerKey,
            config.method?.toUpperCase() ?? 'GET',
            url,
            formatBody(config.data),
            timestamp,
        ].join('+');
        const hash = createHash('sha1')
            .update(payload)
            .digest('hex');
        config.headers[ 'X-Ovh-Signature' ] = `$1$${hash}`;
    }
}
