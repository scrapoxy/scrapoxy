import { Transform } from 'stream';


export function bytesToHuman(size: number): string {
    if (size > 1073741824) {
        return `${(size / 1073741824).toFixed(2)} GB`;
    }

    if (size > 1048576) {
        return `${(size / 1048576).toFixed(2)} MB`;
    }

    if (size > 1024) {
        return `${(size / 1024).toFixed(2)} KB`;
    }

    return `${size.toFixed(2)} B`;
}

export class SpeedMonitor extends Transform {
    private counter = 0;

    private timer: NodeJS.Timer | undefined = void 0;

    constructor() {
        super();

        this.timer = setInterval(
            () => {
                this.emit(
                    'speed',
                    this.counter
                );
                this.counter = 0;
            },
            1000
        );

        this.on(
            'end',
            () => {
                this.stopTimer();
            }
        );
    }

    #_transform(
        chunk: Buffer, encoding: BufferEncoding, callback
    ) {
        if (chunk) {
            this.counter += chunk.length;
            this.push(chunk);
        }
        callback();
    }

    private stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = void 0;
        }
    }
}
