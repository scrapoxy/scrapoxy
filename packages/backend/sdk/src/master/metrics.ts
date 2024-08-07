import { PassThrough } from 'stream';
import type {
    IProxyMetricsAdd,
    IProxyToConnect,
} from '@scrapoxy/common';
import type {
    ClientRequestArgs,
    IncomingMessage,
} from 'http';


export class ConnectionMetrics {
    private readonly removeReadListener: (() => void) | undefined = void 0;

    private readonly removeWriteListener: (() => void) | undefined = void 0;

    constructor(
        private readonly proxy: IProxyToConnect,
        private readonly proxies: Map<string, IProxyMetricsAdd>,
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

    addRequestHeaders(req: ClientRequestArgs) {
        let size = 12 +
            (req.method ? req.method.length : 0) +
            (req.path ? req.path.length : 0);

        if (req.headers) {
            for (const [
                key, value,
            ] of req.headers as any) {
                size += key.length + value.length + 4;
            }
        }

        this.getMetrics().bytesSent += size;
    }

    addResponseHeaders(res: IncomingMessage) {
        let size = 12 +
            res.httpVersion.length +
            (res.statusCode ? res.statusCode.toString().length : 0) +
            (res.statusMessage ? res.statusMessage.length : 0);

        for (const item of res.rawHeaders) {
            size += item.length;
        }

        size += 2 * res.rawHeaders.length; // 4 characters every 2 item (4/2=2) for line return

        const metrics = this.getMetrics();
        metrics.bytesReceived += size;

        if (res.statusCode) {
            if (res.statusCode < 400) {
                metrics.requestsValid += 1;
            } else {
                metrics.requestsInvalid += 1;
            }
        }
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
                requestsValid: 0,
                requestsInvalid: 0,
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
