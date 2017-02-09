'use strict';

const LocalProxy = require('./local-proxy'),
    sigstop = require('../../../common/sigstop'),
    winston = require('winston');


if (process.argv.length !== 4) {
    winston.info('local-proxy usage: node ./index.js <name> <port>');

    process.exit(1);
}

const name = process.argv[2],
    port = parseInt(process.argv[3]);

const proxy = new LocalProxy(name, port);

sigstop(() => {
    proxy.shutdown();

    process.exit(0);
});

proxy
    .listen()
    .catch((err) => {
        winston.error('Cannot start proxy: ', err);

        process.exit(1);
    });
