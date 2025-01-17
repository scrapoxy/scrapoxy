import { promises as fs } from 'fs';


enum ESectionType {
    General = 'general',
    Certificate = 'certificate',
    Key = 'key',
}


export class ConfigLoader {
    private readonly config: Map<string, string> = new Map();

    private certificateValue: string | undefined = void 0;

    private keyValue: string | undefined = void 0;

    public get certificate(): string {
        if (!this.certificateValue) {
            throw new Error('certificate not found');
        }

        return this.certificateValue;
    }

    public get key(): string {
        if (!this.keyValue) {
            throw new Error('key not found');
        }

        return this.keyValue;
    }

    public getKeyInt(key: string): number {
        if (!this.config.has(key)) {
            throw new Error(`${key} not found`);
        }

        return parseInt(
            this.config.get(key) as string,
            10
        );
    }

    async load(filename: string): Promise<void> {
        const rawFile = await fs.readFile(
            filename,
            'utf8'
        );
        const lines = rawFile.toString()
            .split('\n');
        let section: ESectionType | undefined = void 0;
        for (const line of lines) {
            const lineTrimmed = line.trim();

            if (lineTrimmed === '[general]') {
                section = ESectionType.General;
            } else if (lineTrimmed === '[certificate]') {
                section = ESectionType.Certificate;
                this.certificateValue = '';
            } else if (lineTrimmed === '[key]') {
                section = ESectionType.Key;
                this.keyValue = '';
            } else {
                switch (section) {
                    case ESectionType.General: {
                        const ind = lineTrimmed.indexOf('=');

                        if (ind > 0) {
                            const key = lineTrimmed.substring(
                                0,
                                ind
                            )
                                .trim();
                            const value = lineTrimmed.substring(ind + 1)
                                .trim();

                            this.config.set(
                                key,
                                value
                            );
                        }
                        break;
                    }

                    case ESectionType.Certificate: {
                        this.certificateValue += lineTrimmed + '\n';
                        break;
                    }

                    case ESectionType.Key: {
                        this.keyValue += lineTrimmed + '\n';
                        break;
                    }

                    default: {
                        // Ignore
                    }
                }
            }
        }

        if (this.certificateValue) {
            this.certificateValue = this.certificateValue.trim();
        }

        if (this.keyValue) {
            this.keyValue = this.keyValue.trim();
        }
    }
}
