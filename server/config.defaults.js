'use strict';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // Allow wrong certificates

module.exports = {
    proxy: {
        port: 8888,
        useMitm: false,
        mitmCaDir: null,
    },

    commander: {
        port: 8889,
    },

    instance: {
        checkDelay: 10000, // 10sec
        checkAliveDelay: 20000, // 20sec
        stopIfCrashedDelay: 300000, // 5min,
        addProxyNameInRequest: false,

        autorestart: {
            minDelay: 3600000, // 1h
            maxDelay: 43200000, // 12h
        },

        scaling: {
            downscaleDelay: 600000, // 10min
        },
    },

    providers: {
        awsec2: {
            tag: 'Proxy',
            maxRunningInstances: 10,
        },

        ovhcloud: {
            name: 'Proxy',
            maxRunningInstances: 10,
        },

        digitalocean: {
            name: 'Proxy',
            maxRunningInstances: 10,
        },

        vscale: {
            name: 'Proxy',
            maxRunningInstances: 10,
        },
    },

    stats: {
        retention: 86400000, // 24h

        samplingDelay: 1000,
    },

    test: {
        //mirror: 'http://91.121.178.196:13337',
    },
};
