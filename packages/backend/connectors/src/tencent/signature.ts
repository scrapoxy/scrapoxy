import {
    createHash,
    createHmac, 
} from 'crypto';
import type { InternalAxiosRequestConfig } from 'axios';


export class TencentCloudSignerV4 {
    private static readonly ALGORITHM = 'TC3-HMAC-SHA256';

    // eslint-disable-next-line @typescript-eslint/naming-convention
    private static readonly DEFAULT_HOST = 'cvm.tencentcloudapi.com';

    // eslint-disable-next-line @typescript-eslint/naming-convention
    private static readonly DEFAULT_CONTENT_TYPE = 'application/json; charset=utf-8';

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
        const contentType = config.headers[ 'Content-Type' ] ?? TencentCloudSignerV4.DEFAULT_CONTENT_TYPE;
        const host = config.headers.Host || TencentCloudSignerV4.DEFAULT_HOST;
        const action = (config.headers[ 'X-TC-Action' ] as string || '').toLowerCase();
        const signedHeaders = 'content-type;host;x-tc-action';
        const canonicalHeaders = [
            `content-type:${contentType}`, `host:${host}`, `x-tc-action:${action}`,
        ].join('\n') + '\n';
        const hashedRequestPayload = this.hashHex(config.data || '');
        const canonicalRequest = [
            method,
            canonicalUri,
            canonicalQueryString,
            canonicalHeaders,
            signedHeaders,
            hashedRequestPayload,
        ].join('\n');
        const credentialScope = `${date}/${this.service}/tc3_request`;
        const hashedCanonicalRequest = this.hashHex(canonicalRequest);
        const stringToSign = [
            TencentCloudSignerV4.ALGORITHM,
            timestamp,
            credentialScope,
            hashedCanonicalRequest,
        ].join('\n');
        const secretDate = this.hmac(
            `TC3${this.secretKey}`,
            date
        );
        const secretService = this.hmac(
            secretDate,
            this.service
        );
        const secretSigning = this.hmac(
            secretService,
            'tc3_request'
        );
        const signature = this.hmac(
            secretSigning,
            stringToSign
        )
            .toString('hex');
        const authorization = `${TencentCloudSignerV4.ALGORITHM} ` +
            `Credential=${this.secretId}/${credentialScope}, ` +
            `SignedHeaders=${signedHeaders}, ` +
            `Signature=${signature}`;
        config.headers.Authorization = authorization;
    }

    private hashHex(message: string): string {
        if (typeof message !== 'string') {
            message = JSON.stringify(message);
        }

        return createHash('sha256')
            .update(
                message,
                'utf8'
            )
            .digest('hex');
        
    }

    private hmac(
        key: string | Buffer, message: string
    ): Buffer {
        return createHmac(
            'sha256',
            key
        )
            .update(
                message,
                'utf8'
            )
            .digest();
    }
}
