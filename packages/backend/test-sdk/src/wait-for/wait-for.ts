import { sleep } from '@scrapoxy/common';


export function waitFor(
    expectation: () => void | Promise<void>, retry = 8, timeout = 1000
): Promise<void> {
    const retryAfterSleep = (err: any) => {
        if (retry > 0) {
            return sleep(timeout)
                .then(() => waitFor(
                    expectation,
                    retry - 1,
                    timeout
                ));
        }

        throw err;
    };

    try {
        return Promise.resolve(expectation())
            .catch(retryAfterSleep);
    } catch (err: any) {
        return retryAfterSleep(err);
    }
}
