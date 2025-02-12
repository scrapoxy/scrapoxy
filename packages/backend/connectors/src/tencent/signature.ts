import {
    hashHex,
    hmac,
} from './tencent.helpers';
import type { InternalAxiosRequestConfig } from 'axios';


const ALGORITHM = 'TC3-HMAC-SHA256';

export class TencentCloudSignerV4 {
    constructor(
        private readonly region: string,
        private readonly secretId: string,
        private readonly secretKey: string,
        private readonly service: string
    ) {}

    public sign(config: InternalAxiosRequestConfig): void {
        const timestamp = Math.floor(Date.now() / 1000);
        const date = new Date(timestamp * 1000)
            .toISOString()
            .split('T')[ 0 ];

        config.headers[ 'X-TC-Timestamp' ] = timestamp.toString();
        config.headers[ 'X-TC-Region' ] ||= this.region;

        const method = config.method?.toUpperCase() ?? 'POST';
        const canonicalUri = '/';
        const canonicalQueryString = '';
        const contentType = config.headers[ 'Content-Type' ] ?? 'application/json; charset=utf-8';
        const host = config.headers.Host ?? 'cvm.tencentcloudapi.com';
        const action = (config.headers[ 'X-TC-Action' ] as string || '').toLowerCase();
        const signedHeaders = 'content-type;host;x-tc-action';
        const canonicalHeaders = [
            `content-type:${contentType}`, `host:${host}`, `x-tc-action:${action}`,
        ].join('\n') + '\n';
        const hashedRequestPayload = hashHex(config.data || '');
        const canonicalRequest = [
            method,
            canonicalUri,
            canonicalQueryString,
            canonicalHeaders,
            signedHeaders,
            hashedRequestPayload,
        ].join('\n');
        const credentialScope = `${date}/${this.service}/tc3_request`;
        const hashedCanonicalRequest = hashHex(canonicalRequest);
        const stringToSign = [
            ALGORITHM,
            timestamp,
            credentialScope,
            hashedCanonicalRequest,
        ].join('\n');
        const secretDate = hmac(
            `TC3${this.secretKey}`,
            date
        );
        const secretService = hmac(
            secretDate,
            this.service
        );
        const secretSigning = hmac(
            secretService,
            'tc3_request'
        );
        const signature = hmac(
            secretSigning,
            stringToSign
        )
            .toString('hex');
        const authorization = `${ALGORITHM} ` +
            `Credential=${this.secretId}/${credentialScope}, ` +
            `SignedHeaders=${signedHeaders}, ` +
            `Signature=${signature}`;
        config.headers.Authorization = authorization;
    }
}
