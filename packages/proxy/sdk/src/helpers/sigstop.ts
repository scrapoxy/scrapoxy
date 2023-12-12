export function sigstop(callback: () => void) {
    for (const signal of [
        'SIGABRT',
        'SIGALRM',
        'SIGBUS',
        'SIGFPE',
        'SIGHUP',
        'SIGILL',
        'SIGINT',
        'SIGQUIT',
        'SIGSEGV',
        'SIGTERM',
        'SIGUSR1',
        'SIGUSR2',
        'SIGSYS',
        'SIGTRAP',
        'SIGVTALRM',
        'SIGXFSZ',
    ]) {
        process.on(
            signal,
            callback
        );
    }
}
