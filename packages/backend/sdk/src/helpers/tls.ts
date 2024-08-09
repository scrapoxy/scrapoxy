import * as crypto from 'crypto';

// from https://getsetfetch.org/blog/tls-fingerprint.html

const nodeOrderedCipherList = crypto.constants.defaultCipherList.split(':');
// keep the most important ciphers in the same order
const fixedCipherList = nodeOrderedCipherList.slice(
    0,
    3
);

export function generateRandomCiphers(): string {
    // shuffle the rest
    const shuffledCipherList = nodeOrderedCipherList.slice(3)
        .map((cipher) => ({
            cipher, sort: Math.random(),
        }))
        .sort((
            a, b
        ) => a.sort - b.sort)
        .map(({ cipher }) => cipher);

    return [
        ...fixedCipherList, ...shuffledCipherList,
    ].join(':');
}
