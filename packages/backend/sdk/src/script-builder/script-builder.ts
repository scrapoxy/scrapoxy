import { promises as fs } from 'fs';
import { resolve } from 'path';
import { promisify } from 'util';
import { gzip } from 'zlib';
import { getEnvAssetsPath } from '../helpers';
import type { ICertificate } from '@scrapoxy/common';


const gzipAsync = promisify(gzip);


export class ScriptBuilder {
    private readonly rootPath: string;

    private readonly execUrl: string;

    constructor(
        private readonly port: number,
        private readonly certificate: ICertificate,
        architecture: string
    ) {
        switch (architecture) {
            case 'amd64': {
                this.execUrl = 'https://scrapoxy.io/l/scrapoxy-proxy-amd64';
                break;
            }

            case 'arm64': {
                this.execUrl = 'https://scrapoxy.io/l/scrapoxy-proxy-arm64';
                break;
            }

            default: {
                throw new Error(`Unsupported architecture: ${architecture}`);
            }
        }

        this.rootPath = resolve(
            getEnvAssetsPath(),
            'proxy'
        );
    }

    public async build(): Promise<string> {
        // Create the script
        const configIni = [
            '[general]',
            `port=${this.port}`,
            'timeout=60000',
            '[certificate]',
            this.certificate.cert,
            '[key]',
            this.certificate.key,
        ].join('\n');
        const configIniFile = this.writeFileFromString(
            configIni,
            '/root/config.ini'
        );
        const scriptRaw = [
            '#!/bin/bash',
            ...configIniFile,
            'cd /root',
            `curl -sL ${this.execUrl} | gunzip > ./proxy`,
            'chmod +x ./proxy',
            './proxy',
        ].join('\n');
        // Create a auto-decompress script
        const scriptRawCompressed = await gzipAsync(scriptRaw);
        const scriptRawCompressedB64 = scriptRawCompressed.toString('base64');

        return [
            '#!/bin/sh',
            'cat << \'EOF\' > /tmp/spx.b64',
            scriptRawCompressedB64,
            'EOF',
            '',
            'base64 -d /tmp/spx.b64 | gunzip | bash -s --',
        ].join('\n');
    }

    protected writeFileFromString(
        data: string, destination: string
    ): string[] {
        if (!data || data.length <= 0) {
            throw new Error(`Cannot write empty data to ${destination}`);
        }

        return [
            `cat << 'EOF' | sudo tee ${destination} > /dev/null`, data, 'EOF',
        ];
    }

    protected async writeFileFromFile(
        filename: string, destination: string
    ): Promise<string[]> {
        const source = resolve(
            this.rootPath,
            filename
        );
        const data = await fs.readFile(source);

        return this.writeFileFromString(
            data.toString(),
            destination
        );
    }
}
