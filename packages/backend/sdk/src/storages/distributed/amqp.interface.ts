export interface IAmqpConnectionManager {
    addListener: (event: string, listener: (err: any) => void) => void;
}
