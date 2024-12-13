import type { ICertificate } from '@scrapoxy/common';
import { promises as fs } from 'fs';
import { resolve } from 'path';
import { getEnvAssetsPath } from './config';


export class InstallScriptBuilder {
    private readonly rootPath: string;

    constructor(private readonly certificate: ICertificate) {
        this.rootPath = resolve(
            getEnvAssetsPath(),
            'proxy'
        );
    }

    async build(): Promise<string> {
        const
            certificateKey = this.writeFileFromString(
                this.certificate.key,
                '/root/certificate.key'
            ),
            certificatePem = this.writeFileFromString(
                this.certificate.cert,
                '/root/certificate.pem'
            );
        const [
            mainJs, packageJson, proxyupSh,
        ] = await Promise.all([
            this.writeFileFromFile(
                'proxy.js',
                '/root/proxy.js'
            ),
            this.writeFileFromFile(
                'package.json',
                '/root/package.json'
            ),
            this.writeFileFromFile(
                'proxyup.sh',
                '/etc/init.d/proxyup.sh'
            ),
        ]);

        return [
            '#!/bin/bash',
            'sudo apt-get update',
            'sudo apt-get install -y ca-certificates curl gnupg',
            'sudo mkdir -p /etc/apt/keyrings',
            'curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor --yes -o /etc/apt/keyrings/nodesource.gpg',
            'echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_18.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list',
            'sudo apt-get update',
            'sudo apt-get install nodejs -y',
            ...mainJs,
            ...packageJson,
            ...proxyupSh,
            ...certificatePem,
            ...certificateKey,
            'sudo npm install --prefix /root',
            'sudo chmod a+x /etc/init.d/proxyup.sh',
            'sudo update-rc.d proxyup.sh defaults',
            'sudo /etc/init.d/proxyup.sh start',
        ].join('\n');
    }

    private writeFileFromString(
        data: string, destination: string
    ): string[] {
        return [
            `cat << 'EOF' | sudo tee ${destination} > /dev/null`, data, 'EOF',
        ];
    }

    private async writeFileFromFile(
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


let script = new InstallScriptBuilder({cert:'test', key:'test'}).build()
console.log(script);