export class HttpTransportError extends Error {
    constructor(
        public readonly statusCode: number | undefined,
        message: string
    ) {
        super(message);
    }
}
