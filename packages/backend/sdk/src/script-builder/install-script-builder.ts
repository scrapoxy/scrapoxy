import { AScriptBuilder } from './script-builder.abstract';


export class InstallScriptBuilder extends AScriptBuilder {
    async build(): Promise<string> {
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
            ...configIniFile,
            'sudo npm install --prefix /root',
            'sudo chmod a+x /etc/init.d/proxyup.sh',
            'sudo update-rc.d proxyup.sh defaults',
            'sudo /etc/init.d/proxyup.sh start',
        ].join('\n');
    }
}
