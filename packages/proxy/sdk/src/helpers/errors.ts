export function parseError(err: any) {
    if (!err) {
        return;
    }

    // avoid AggregateError
    if (!err.errors ||
        err.errors.length <= 0) {
        return err;
    }

    return err.errors[ 0 ];
}
