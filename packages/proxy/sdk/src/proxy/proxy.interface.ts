// We don't use LoggerService from @nestjs/common because we don't want to package nestjs just for it
export interface IProxyLogger {
    log: (message: string) => any;

    error: (message: string, stack?: string) => any;

    debug: (message: string) => any;
}


export interface IProxy {
    port: number | null;

    connectsCount: number;

    connectsIgnoreCount: number;

    bytesReceived: number;

    bytesReceivedIgnore: number;

    bytesSent: number;

    bytesSentIgnore: number;

    listen: (port: number) => Promise<number>;

    close: () => Promise<void>;
}
