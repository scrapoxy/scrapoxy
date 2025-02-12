import { promises as fs } from 'fs';
import { resolve } from 'path';
import { promisify } from 'util';
import { gzip } from 'zlib';
import { getEnvAssetsPath } from '../helpers';
import type { ICertificate } from '@scrapoxy/common';


const gzipAsync = promisify(gzip);


export abstract class AScriptBuilder {
    protected readonly rootPath: string;

    constructor(
        protected readonly port: number,
        protected readonly certificate: ICertificate
    ) {
        this.rootPath = resolve(
            getEnvAssetsPath(),
            'proxy'
        );
    }

    public async build(): Promise<string> {
        const scriptRaw = await this.generateScript();
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

    protected abstract generateScript(): Promise<string>;

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
