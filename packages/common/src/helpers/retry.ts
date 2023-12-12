import { sleep } from './sleep';


async function retryFn<T extends (
    ...arg0: any[]) => Promise<any>>(
    fn: T,
    args: Parameters<T>,
    count = 2,
    minDelayInMs = 100,
    maxDelayInMs = 1000,
    thisArg?: any
): Promise<Awaited<ReturnType<T>>> {
    try {
        // eslint-disable-next-line prefer-spread
        return await fn.apply(
            thisArg,
            args
        );
    } catch (err: any) {
        if (count <= 0) {
            throw err;
        }

        const delay = Math.ceil(Math.random() * (maxDelayInMs - minDelayInMs) + minDelayInMs);

        await sleep(delay);

        return retryFn(
            fn,
            args,
            count - 1,
            minDelayInMs,
            maxDelayInMs,
            thisArg
        );
    }
}


export function Retry(
    count = 2,
    minDelayInMs = 100,
    maxDelayInMs = 1000
): any {
    return function(
        target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<any>
    ): any {
        const originalFn = descriptor.value;

        descriptor.value = function(...args: any[]) {
            return retryFn(
                originalFn,
                args,
                count,
                minDelayInMs,
                maxDelayInMs,
                this
            );
        };

        return descriptor;
    };
}
