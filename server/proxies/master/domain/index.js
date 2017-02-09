'use strict';

const url = require('url');


module.exports = {
    getBaseDomainForUri,
    convertHostnamePathToUri,
};


////////////

function getBaseDomainForUri(uri) {
    if (!uri) {
        return;
    }

    const urlOpts = url.parse(uri);
    if (!urlOpts.hostname) {
        return;
    }

    if (isIPv4(urlOpts.hostname)) {
        return urlOpts.hostname;
    }

    return getMasterDomain(urlOpts.hostname);


    ////////////

    function isIPv4(hostname) {
        return hostname.match(/^(([1-9]?\d|1\d\d|2[0-5][0-5]|2[0-4]\d)\.){3}([1-9]?\d|1\d\d|2[0-5][0-5]|2[0-4]\d)$/);
    }

    function getMasterDomain(hostname) {
        const part = hostname.split('.');
        if (part.length < 2) {
            return hostname;
        }

        return `${part[part.length - 2]}.${part[part.length - 1]}`;
    }
}


function convertHostnamePathToUri(hostname, path, ssl = false) {
    if (hostname) {
        const urlOpts = {
            protocol: ssl ? 'https' : 'http',
            hostname,
        };

        const base = url.format(urlOpts);

        if (path) {
            return url.resolve(base, path);
        }

        return base;
    }

    return path;
}
