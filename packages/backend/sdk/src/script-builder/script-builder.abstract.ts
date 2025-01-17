import { promises as fs } from 'fs';
import { resolve } from 'path';
import { getEnvAssetsPath } from '../helpers';
import type { ICertificate } from '@scrapoxy/common';


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
