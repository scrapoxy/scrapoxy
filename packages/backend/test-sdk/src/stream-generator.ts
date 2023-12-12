import { Stream } from 'stream';
import { sleep } from '@scrapoxy/common';


const COUNTER_MIN = 10;
const COUNTER_MAX = 250;


interface IGeneratorBase {
    maxSize: number;
}


export interface IGeneratorDelay {
    interval: number;
    sleep: number;
}


export interface IGeneratorStreamConfig extends IGeneratorBase {
    delay?: IGeneratorDelay;
}


export class GeneratorStream extends Stream.Readable {
    private counter = COUNTER_MIN;

    private size = 0;

    constructor(private readonly config: IGeneratorStreamConfig) {
        super();
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    override _read(size: number) {
        void this.nextCounters(size)
            .then((arr) => {
                if (arr.length <= 0) {
                    this.push(null);
                } else {
                    this.push(Buffer.from(arr));
                }
            });
    }

    private async nextCounter(): Promise<number> {
        if (this.size >= this.config.maxSize) {
            return -1;
        }

        const val = this.counter;

        ++this.counter;

        if (this.counter > COUNTER_MAX) {
            this.counter = COUNTER_MIN;
        }

        ++this.size;

        if (this.config.delay && this.size % this.config.delay.interval === 0) {
            await sleep(this.config.delay.sleep);
        }

        return val;
    }

    private async nextCounters(size: number): Promise<number[]> {
        const arr: number[] = [];
        for (let i = 0; i < size; ++i) {
            const c = await this.nextCounter();

            if (c < 0) {
                break;
            }

            arr.push(c);
        }

        return arr;
    }
}


export function generateData(size: number): Buffer {
    const arr: number[] = [];
    let val = COUNTER_MIN;
    for (let i = 0; i < size; ++i) {
        arr.push(val);

        ++val;

        if (val > COUNTER_MAX) {
            val = COUNTER_MIN;
        }
    }

    return Buffer.from(arr);
}


export type IGeneratorCheckStreamConfig = IGeneratorBase;


export class GeneratorCheckStream extends Stream.Writable {
    static from(
        sIn: Stream, config: IGeneratorCheckStreamConfig
    ): Promise<void> {
        return new Promise<void>((
            resolve, reject
        ) => {
            const sOut = new GeneratorCheckStream(config);

            sOut.on(
                'error',
                (err: any) => {
                    reject(err);
                }
            );

            sOut.on(
                'close',
                () => {
                    if (sOut.size !== config.maxSize) {
                        reject(new Error(`Wrong size! Received ${sOut.size} instead of ${config.maxSize}`));

                        return;
                    }

                    resolve();
                }
            );

            sIn.pipe(sOut);
        });
    }

    private counter = COUNTER_MIN;

    private size = 0;

    constructor(private readonly config: IGeneratorCheckStreamConfig) {
        super();
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    override _write(
        chunk: Buffer, encoding: BufferEncoding, callback: (error?: (Error | null)) => void
    ) {
        try {
            for (const c of chunk) {
                this.checkCounter(c);
            }

            callback();
        } catch (err: any) {
            callback(err);
        }
    }

    private checkCounter(val: number) {
        if (val !== this.counter) {
            throw new Error(`Integrity error at ${this.size}`);
        }

        ++this.counter;

        if (this.counter > COUNTER_MAX) {
            this.counter = COUNTER_MIN;
        }

        ++this.size;

        if (this.size > this.config.maxSize) {
            throw new Error(`Size exceeded! ${this.size} > ${this.config.maxSize}`);
        }
    }
}
