export function parseDomain(domain: string | undefined): string | undefined {
    if (!domain) {
        return;
    }

    if (domain.endsWith('.')) {
        domain = domain.slice(
            0,
            -1
        );
    }

    if (domain.length <= 0) {
        return;
    }

    const idx = domain.lastIndexOf('.');

    if (idx < 0) {
        return domain;
    }

    const idx2 = domain.lastIndexOf(
        '.',
        idx - 1
    );

    if (idx2 < 0) {
        return domain;
    }

    return domain.slice(idx2 + 1);
}
