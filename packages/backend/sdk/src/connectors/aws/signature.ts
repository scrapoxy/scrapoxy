import {
    createHash,
    createHmac,
} from 'crypto';
import type { InternalAxiosRequestConfig } from 'axios';


function formatHeaderValue(header: any): any {
    if (typeof header === 'string') {
        return header.trim()
            .replace(
                / +/g,
                ' '
            );
    } else if (Array.isArray(header)) {
        return header.map(formatHeaderValue)
            .join(',');
    }

    return '';
}


function getCanonicalHeaderValues(
    headerKeys: string[], headers: any
) {
    return headerKeys
        .map((key: string) => `${key.toLowerCase()
            .trim()}:${formatHeaderValue(headers[ key ])}\n`)
        .join('');
}


function hashHex(message: string): string {
    return createHash('sha256')
        .update(
            message,
            'utf8'
        )
        .digest('hex');
}


function hmac(
    key: Buffer | string, message: string
): Buffer {
    return createHmac(
        'sha256',
        key
    )
        .update(message)
        .digest();
}


export class AwsSignatureV4 {
    constructor(
        private readonly region: string,
        private readonly accessKeyId: string,
        private readonly secretAccessKey: string
    ) {
    }

    sign(config: InternalAxiosRequestConfig) {
        const now = new Date()
            .toISOString()
            .replace(
                /[:-]/g,
                ''
            )
            .replace(
                /\.\d\d\dZ/,
                'Z'
            );
        const nowDate = now.split('T')[ 0 ];

        config.headers[ 'X-Amz-Date' ] = now;

        const hashedPayload = hashHex(config.data || '');
        config.headers[ 'X-Amz-Content-sha256' ] = hashedPayload;

        const signableHeaderKeys = Object
            .keys(config.headers)
            .filter((key: string) => {
                const keyLC = key.toLowerCase();

                return [
                    'host', 'content-type',
                ].includes(keyLC) || keyLC.startsWith('x-amz-');
            })
            .sort();
        const canonicalHeaderKeyList = signableHeaderKeys
            .map((h) => h.toLowerCase())
            .join(';');
        const canonicalRequest = [
            config.method ? config.method.toUpperCase() : config.data ? 'POST' : 'GET',
            config.url,
            '',
            getCanonicalHeaderValues(
                signableHeaderKeys,
                config.headers
            ),
            canonicalHeaderKeyList,
            hashedPayload,
        ].join('\n');
        const hashedCanonicalRequest = hashHex(canonicalRequest);
        const credentialScope = `${nowDate}/${this.region}/ec2/aws4_request`;
        const stringToSign = [
            'AWS4-HMAC-SHA256',
            now,
            credentialScope,
            hashedCanonicalRequest,
        ].join('\n');
        const dateKey = hmac(
            Buffer.from(`AWS4${this.secretAccessKey}`),
            nowDate
        );
        const dateRegionKey = hmac(
            dateKey,
            this.region
        );
        const dateRegionServiceKey = hmac(
            dateRegionKey,
            'ec2'
        );
        const signingKey = hmac(
            dateRegionServiceKey,
            'aws4_request'
        );
        const signature = hmac(
            signingKey,
            stringToSign
        )
            .toString('hex');

        config.headers.Authorization = `AWS4-HMAC-SHA256 Credential=${this.accessKeyId}/${credentialScope}, SignedHeaders=${canonicalHeaderKeyList}, Signature=${signature}`;
    }
}
