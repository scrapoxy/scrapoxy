import {
    stat,
    watch,
} from 'fs';
import {
    basename,
    dirname,
} from 'path';
import type { IProxyLogger } from '@scrapoxy/proxy-sdk';
import type { FSWatcher } from 'fs';


export function watchFile(
    filename: string, callback: (fn: string) => Promise<void>, logger: IProxyLogger
): FSWatcher {
    const filenameBase = basename(filename);
    const triggerByFile: Map<string, NodeJS.Timeout> = new Map();

    logger.log(`Watching for file ${filename}...`);

    const watcher = watch(
        dirname(filename),
        (
            event, fn
        ) => {
            if (!fn) {
                return;
            }

            // Trigger on rename event (file create/delete) or change event (file content change)
            let trigger = triggerByFile.get(fn);

            if (!trigger) {
                // Avoid multiple triggers within 300ms delay to receive events
                trigger = setTimeout(
                    () => {
                        triggerByFile.delete(fn);

                        if (fn !== filenameBase) {
                            return;
                        }

                        // Check if file exists
                        stat(
                            filename,
                            (
                                err, stats
                            ) => {
                                if (err ?? !stats.isFile()) {
                                    return;
                                }

                                callback(filename)
                                    .catch((errCallback: any) => {
                                        watcher.emit(
                                            'error',
                                            errCallback
                                        );
                                    })
                                    .finally(() => {
                                        logger.log(`Watching for file ${filename}...`);
                                    });
                            }
                        );
                    },
                    300
                );
                triggerByFile.set(
                    fn,
                    trigger
                );
            }
        }
    );

    // Force trigger at startup
    watcher.emit(
        'change',
        'rename',
        filenameBase
    );

    return watcher;
}
