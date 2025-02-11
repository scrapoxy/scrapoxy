import { AScriptBuilder } from './script-builder.abstract';


export class RunScriptBuilder extends AScriptBuilder {
    protected async generateScript(): Promise<string> {
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

        return [
            '#!/bin/bash', ...configIniFile,
        ].join('\n');
    }
}
