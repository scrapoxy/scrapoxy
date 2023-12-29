export interface IUrlOptions {
    protocol: string;
    username: string | undefined;
    password: string | undefined;
    hostname: string | undefined;
    port: number;
    pathname: string;
    search: string | undefined;
    hash: string | undefined;
}

export function urlToUrlOptions(url: string | null | undefined): IUrlOptions | undefined {
    if (!url) {
        return;
    }

    let urlObj: URL;
    try {
        urlObj = new URL(url);
    } catch (err: any) {
        return;
    }

    let port: number | undefined = void 0;

    if (urlObj.port && urlObj.port.length > 0) {
        try {
            port = parseInt(urlObj.port);
        } catch (err: any) {
            port = void 0;
        }
    }

    if (!port) {
        switch (urlObj.protocol) {
            case 'http:': {
                port = 80;

                break;
            }

            case 'https:': {
                port = 443;

                break;
            }

            default: {
                port = 80;
            }
        }
    }

    const options: IUrlOptions = {
        protocol: urlObj.protocol,
        username: urlObj.username && urlObj.username.length > 0 ? urlObj.username : void 0,
        password: urlObj.password && urlObj.password.length > 0 ? urlObj.password : void 0,
        hostname: urlObj.hostname,
        port,
        pathname: urlObj.pathname,
        search: urlObj.search && urlObj.search.length > 0 ? urlObj.search : void 0,
        hash: urlObj.hash && urlObj.hash.length > 0 ? urlObj.hash : void 0,
    };

    return options;
}


export function urlOptionsToUrl(
    options: IUrlOptions | null | undefined,
    withHostname = true
): string | undefined {
    if (!options) {
        return;
    }

    let url = '';

    if (withHostname) {
        url += `${options.protocol}//`;

        if (options.hostname) {
            if (options.username ?? options.password) {
                if (options.username) {
                    url += options.username;
                }

                if (options.password) {
                    url += `:${options.password}`;
                }

                url += '@';
            }

            url += options.hostname;

            if (
                !(options.protocol === 'http:' && options.port === 80) &&
                !(options.protocol === 'https:' && options.port === 443)
            ) {
                url += `:${options.port}`;
            }
        }
    }

    url += options.pathname;

    if (options.search) {
        url += options.search;
    }

    if (options.hash) {
        url += options.hash;
    }

    if (url.length <= 0) {
        return;
    }

    return url;
}


// eslint-disable-next-line max-len
const IP_ADDRESS_V4_AND_V6 = /((^\s*((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))\s*$)|(^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$))/;


export function isUrl(url: string | undefined | null): boolean {
    if (!url) {
        return false;
    }

    const urlTrimmed = url.trim();

    if (urlTrimmed.length <= 0) {
        return false;
    }

    if (IP_ADDRESS_V4_AND_V6.test(urlTrimmed)) {
        return false;
    }

    return true;
}
