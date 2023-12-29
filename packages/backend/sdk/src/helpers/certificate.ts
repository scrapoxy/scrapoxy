import { promises as fs } from 'fs';
import { resolve } from 'path';
import { ONE_MINUTE_IN_MS } from '@scrapoxy/common';
import {
    md,
    pki,
    random,
    util,
} from 'node-forge';
import { getEnvAssetsPath } from './config';
import type {
    ICertificate,
    ICertificateInfo,
} from '@scrapoxy/common';


function makeNumberPositive(hexString: string): string {
    let mostSignificativeHexDigitAsInt = parseInt(
        hexString[ 0 ],
        16
    );

    if (mostSignificativeHexDigitAsInt < 8) return hexString;

    mostSignificativeHexDigitAsInt -= 8;

    return mostSignificativeHexDigitAsInt.toString() + hexString.substring(1);
}

// Generate a random serial number for the Certificate
function randomSerialNumber(): string {
    return makeNumberPositive(util.bytesToHex(random.getBytesSync(20)));
}


export async function readCaCert(): Promise<string> {
    const data = await fs.readFile(resolve(
        getEnvAssetsPath(),
        'certificates',
        'scrapoxy-ca.crt'
    ));

    return data.toString();
}


export async function readCaKey(): Promise<string> {
    const data = await fs.readFile(resolve(
        getEnvAssetsPath(),
        'certificates',
        'scrapoxy-ca.key'
    ));

    return data.toString();
}


export function generateCertificateSelfSigned(durationInMs: number): ICertificateInfo {
    if (!durationInMs || durationInMs <= 0) {
        throw new Error('durationInMs must be strictly greater to 0 ms');
    }

    const notBefore = new Date();
    const notAfter = new Date(notBefore.getTime() + durationInMs);
    const keypair = pki.rsa.generateKeyPair(2048);
    const cert = pki.createCertificate();
    Object.assign(
        cert,
        {
            publicKey: keypair.publicKey,
            serialNumber: randomSerialNumber(),
            validity: {
                notBefore,
                notAfter,
            },
        }
    );

    const attrs: pki.CertificateField[] = [
        {
            name: 'commonName',
            value: 'localhost',
        },
    ];
    cert.setSubject(attrs);
    cert.setIssuer(attrs);

    cert.sign(
        keypair.privateKey,
        md.sha256.create()
    );

    const info: ICertificateInfo = {
        certificate: {
            cert: pki.certificateToPem(cert),
            key: pki.privateKeyToPem(keypair.privateKey),
        },
        startAt: notBefore.getTime(),
        endAt: notAfter.getTime(),
    };

    return info;
}


export function generateCertificateFromCa(
    caCert: pki.Certificate,
    caKey: pki.rsa.PrivateKey,
    hostname: string,
    durationInMs: number
): ICertificateInfo {
    if (!durationInMs || durationInMs <= 0) {
        throw new Error('durationInMs must be strictly greater to 0 ms');
    }

    if (!hostname || hostname.length <= 0) {
        throw new Error('hostname must be defined');
    }

    const notBefore = new Date();
    const notAfter = new Date(notBefore.getTime() + durationInMs);
    const keypair = pki.rsa.generateKeyPair(2048);
    const cert = pki.createCertificate();
    Object.assign(
        cert,
        {
            publicKey: keypair.publicKey,
            serialNumber: randomSerialNumber(),
            validity: {
                notBefore,
                notAfter,
            },
        }
    );

    const attrs: pki.CertificateField[] = [
        {
            name: 'commonName',
            value: hostname,
        },
    ];
    cert.setSubject(attrs);
    cert.setIssuer(caCert.subject.attributes);

    const altNames: any[] = [
        {
            type: 2, value: hostname,
        },
    ];

    if (/^[\d.]+$/.exec(hostname)) {
        altNames.push({
            type: 7, ip: hostname,
        });
    }

    const extensions: any[] = [
        {
            name: 'basicConstraints',
            cA: false,
        },
        {
            name: 'nsCertType',
            server: true,
        },
        {
            name: 'subjectKeyIdentifier',
        },
        {
            name: 'authorityKeyIdentifier',
            authorityCertIssuer: true,
            serialNumber: caCert.serialNumber,
        },
        {
            name: 'keyUsage',
            digitalSignature: true,
            nonRepudiation: true,
            keyEncipherment: true,
        },
        {
            name: 'extKeyUsage',
            serverAuth: true,
        },
        {
            name: 'subjectAltName',
            altNames,
        },
    ];
    cert.setExtensions(extensions);

    cert.sign(
        caKey,
        md.sha256.create()
    );

    const info: ICertificateInfo = {
        certificate: {
            cert: pki.certificateToPem(cert),
            key: pki.privateKeyToPem(keypair.privateKey),
        },
        startAt: notBefore.getTime(),
        endAt: notAfter.getTime(),
    };

    return info;
}


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
