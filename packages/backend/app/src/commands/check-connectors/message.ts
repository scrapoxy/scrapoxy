import type { ICheckConnectorResponse } from './check.interface';


export class EmailMessageBuilder {
    private readonly lines: string[] = [];

    get size(): number {
        return this.lines.length;
    }

    addResponse(response: ICheckConnectorResponse) {
        this.lines.push(`Connector ${response.name}:`);

        if (response.proxies.length > response.maxProxies) {
            this.lines.push(`  ${response.proxies.length} proxies:`);
            for (const proxy of response.proxies) {
                this.lines.push(`  > ${proxy.key} (${proxy.description})`);
            }
        }

        if (response.errors.length > 0) {
            this.lines.push(`  ${response.errors.length} errors:`);
            for (const error of response.errors) {
                this.lines.push(`  > ${error}`);
            }
        }
    }

    toString() {
        return this.lines.join('\n');
    }
}

export class TextMessageBuilder {
    private readonly lines: string[] = [];

    addResponse(response: ICheckConnectorResponse) {
        this.lines.push(`Issues found in connector ${response.name}`);

        if (response.proxies.length > response.maxProxies) {
            const proxies = response.proxies.map((p) => `${p.key} (${p.description})`);
            this.lines.push(`> Proxies: ${proxies.join(', ')}`);
        }

        if (response.errors.length > 0) {
            this.lines.push(`> Errors: ${response.errors.join(', ')}`);
        }
    }

    toString() {
        return this.lines.join('\n');
    }
}
