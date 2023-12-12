export function formatNumberUnit(
    val?: number, suffix = ''
): string {
    if (val === 0) {
        return `0${suffix}`;
    }

    if (!val) {
        return '';
    }

    if (val < 1000) {
        const sval = Math.round(val);

        return `${sval}${suffix}`;
    }

    if (val < 1000000) {
        const sval = Math.round(val / 10.0) / 100.0;

        return `${sval}K${suffix}`;
    }

    const sval = Math.round(val / 10000.0) / 100.0;

    return `${sval}M${suffix}`;
}


export function formatFileUnit(
    val?: number, suffix = ''
): string {
    if (val === 0) {
        return `0B${suffix}`;
    }

    if (!val) {
        return '';
    }

    if (val < 1024) {
        const sval = Math.round(val);

        return `${sval}B${suffix}`;
    }

    if (val < 1048576) {
        const sval = Math.round(val / 10.24) / 100.0;

        return `${sval}KB${suffix}`;
    }

    if (val < 1073741824) {
        const sval = Math.round(val / 10485.76) / 100.0;

        return `${sval}MB${suffix}`;
    }

    if (val < 1099511627776) {
        const sval = Math.round(val / 10737418.24) / 100.0;

        return `${sval}GB${suffix}`;
    }

    const sval = Math.round(val / 10995116277.76) / 100.0;

    return `${sval}TB${suffix}`;
}


export function formatTimeUnit(val?: number): string {
    if (val === 0) {
        return '0s';
    }

    if (!val) {
        return '';
    }

    if (val < 60) {
        const sval = Math.floor(val);

        return `${sval}s`;
    }

    if (val < 3600) {
        const sval = Math.floor(val / 60);

        return `${sval}m`;
    }

    if (val < 86400) {
        const sval = Math.floor(val / 3600);

        return `${sval}h`;
    }

    if (val < 31536000) {
        const sval = Math.floor(val / 86400);

        return `${sval}d`;
    }

    const sval = Math.floor(val / 31536000);

    return `${sval}y`;
}
