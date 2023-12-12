import { PassThrough } from 'stream';
import type {
    IProxyMetricsAdd,
    IProxyToConnect,
} from '@scrapoxy/common';


export class ConnectionMetrics {
    private removeReadListener: (() => void) | undefined = void 0;

    private removeWriteListener: (() => void) | undefined = void 0;

    constructor(
        private readonly proxy: IProxyToConnect,
        private readonly proxies: Map<string, IProxyMetricsAdd>
    ) {}

    register(
        sIn: PassThrough,
        sOut: PassThrough
    ) {
        this.getMetrics().requests += 1;

        // Read
        const readListener = (chunk: Buffer) => {
            this.getMetrics().bytesReceived += chunk.length;
        };
        sIn.on(
            'data',
            readListener
        );

        this.removeReadListener = () => {
            sIn.removeListener(
                'data',
                readListener
            );
        };

        // Write
        const writeListener = (chunk: Buffer) => {
            this.getMetrics().bytesSent += chunk.length;
        };

        sOut.on(
            'data',
            writeListener
        );

        this.removeWriteListener = () => {
            sOut.removeListener(
                'data',
                writeListener
            );
        };
    }

    unregister() {
        if (this.removeWriteListener) {
            this.removeWriteListener();
        }

        if (this.removeReadListener) {
            this.removeReadListener();
        }
    }

    private getMetrics(): IProxyMetricsAdd {
        let val = this.proxies.get(this.proxy.id);

        if (!val) {
            val = {
                id: this.proxy.id,
                projectId: this.proxy.projectId,
                connectorId: this.proxy.connectorId,
                requests: 0,
                bytesReceived: 0,
                bytesSent: 0,
            };
            this.proxies.set(
                this.proxy.id,
                val
            );
        }

        return val;
    }
}
