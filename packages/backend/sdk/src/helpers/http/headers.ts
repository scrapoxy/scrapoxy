export class ArrayHttpHeaders {
    private readonly headers: [string, string][] = [];

    constructor(rawHeaders: string[] = []) {
        for (let i = 0; i < rawHeaders.length; i += 2) {
            this.headers.push([
                rawHeaders[ i ], rawHeaders[ i + 1 ],
            ]);
        }
    }

    clone(): ArrayHttpHeaders {
        const clone = new ArrayHttpHeaders();
        for (const header of this.headers) {
            clone.addHeader(
                header[ 0 ],
                header[ 1 ]
            );
        }

        return clone;
    }

    getFirstHeader(key: string): string | undefined {
        const keyLc = key.toLowerCase();
        for (const header of this.headers) {
            if (header[ 0 ].toLowerCase() === keyLc) {
                return header[ 1 ];
            }
        }

        return void 0;
    }

    getFirstHeaderWithPrefix(prefix: string): string | undefined {
        const prefixLc = prefix.toLowerCase();

        for (let i = this.headers.length - 1; i >= 0; --i) {
            if (this.headers[ i ][ 0 ].toLowerCase()
                .startsWith(prefixLc)) {
                return this.headers[ i ][ 1 ];
            }
        }

        return void 0;
    }

    getFirstHeaderWithRegexValue(
        key: string, regex: RegExp
    ): RegExpExecArray | undefined {
        const prefixLc = key.toLowerCase();

        for (let i = this.headers.length - 1; i >= 0; --i) {
            if (this.headers[ i ][ 0 ].toLowerCase() === prefixLc) {
                const arr = regex.exec(this.headers[ i ][ 1 ]);

                if (arr) {
                    return arr;
                }
            }
        }

        return void 0;
    }

    addHeader(
        key: string, value: string
    ): ArrayHttpHeaders {
        this.headers.push([
            key, value,
        ]);

        return this;
    }

    addHeaderArray(
        key: string, ...values: string[]
    ): ArrayHttpHeaders {
        for (const value of values) {
            this.headers.push([
                key, value,
            ]);
        }

        return this;
    }

    setOrUpdateFirstHeader(
        key: string, value: string
    ): ArrayHttpHeaders {
        const keyLc = key.toLowerCase();
        for (const header of this.headers) {
            if (header[ 0 ].toLowerCase() === keyLc) {
                header[ 1 ] = value;

                return this;
            }
        }

        this.headers.push([
            key, value,
        ]);

        return this;
    }

    removeHeaders(key: string): ArrayHttpHeaders {
        const keyLc = key.toLowerCase();

        for (let i = this.headers.length - 1; i >= 0; --i) {
            if (this.headers[ i ][ 0 ].toLowerCase() === keyLc) {
                this.headers.splice(
                    i,
                    1
                );
            }
        }

        return this;
    }

    removeHeadersWithPrefix(prefix: string) {
        const prefixLc = prefix.toLowerCase();

        for (let i = this.headers.length - 1; i >= 0; --i) {
            if (this.headers[ i ][ 0 ].toLowerCase()
                .startsWith(prefixLc)) {
                this.headers.splice(
                    i,
                    1
                );
            }
        }
    }

    removeHeadersWithRegexValue(
        key: string, regex: RegExp
    ): ArrayHttpHeaders {
        const prefixLc = key.toLowerCase();

        for (let i = this.headers.length - 1; i >= 0; --i) {
            if (this.headers[ i ][ 0 ].toLowerCase() === prefixLc &&
                regex.test(this.headers[ i ][ 1 ])) {
                this.headers.splice(
                    i,
                    1
                );
            }
        }

        return this;
    }

    toArray(): [string, string][] {
        return this.headers;
    }
}
