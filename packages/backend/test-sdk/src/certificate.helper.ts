import {
    generateCertificateFromCa,
    generateCertificateSelfSigned,
    readCaCert,
    readCaKey,
} from '@scrapoxy/backend-sdk';
import { ONE_MINUTE_IN_MS } from '@scrapoxy/common';
import { pki } from 'node-forge';
import type { ICertificate } from '@scrapoxy/common';


export function generateCertificateSelfSignedForTest(): ICertificate {
    const certificateInfo = generateCertificateSelfSigned(10 * ONE_MINUTE_IN_MS);

    return certificateInfo.certificate;
}


export async function generateCertificateFromCaTest(): Promise<ICertificate> {
    const [
        caCertRaw, caKeyRaw,
    ] = await Promise.all([
        readCaCert(), readCaKey(),
    ]);
    const
        caCert = pki.certificateFromPem(caCertRaw),
        caKey = pki.privateKeyFromPem(caKeyRaw);
    const certificateInfo = generateCertificateFromCa(
        caCert,
        caKey,
        'localhost',
        10 * ONE_MINUTE_IN_MS
    );

    return certificateInfo.certificate;
}
