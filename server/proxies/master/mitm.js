'use strict';
const url = require('url');
const http = require('http');
const _ = require('lodash');
const Promise = require('bluebird');
const winston = require('winston');
const MITMProxy = require('http-mitm-proxy');
const domain = require('./domain');
const ProxyAgent = require('./proxy-agent');

module.exports = class MitmMaster {
    constructor(config, manager, stats) {
        winston.info('[Master] Using HTTPS-intercepting MITM proxy');
        this._config = config;
        this._manager = manager;
        this._stats = stats;

        // HTTP Agent
        this._agent = new http.Agent();
        this._proxyAgent = new ProxyAgent({
            agent: this._agent,
        });

        const server = new MITMProxy();

        server.onRequest(onRequest.bind(this));
        server.onError(onProxyError.bind(this));
        server.onRequestHeaders(onRequestHeaders.bind(this));

        // Proxy Auth
        if (this._config.auth &&
            this._config.auth.username &&
            this._config.auth.password) {
            winston.debug("[Master] Found credentials with username '%s'", this._config.auth.username);

            const usernamePasswordB64 = new Buffer(`${this._config.auth.username}:${this._config.auth.password}`).toString('base64');
            this._token = `Basic ${usernamePasswordB64}`;
        }

        this._server = server;
    }

    listen() {
        return new Promise((resolve, reject) => {

            const serverConf = {
                port: this._config.port,
                sslCaDir: this._config.mitmCaDir,
                forceSNI: this._config.mitmForceSNI,
                silent: winston.level !== 'debug',
            };

            this._server.listen(serverConf, (err) => {
                if (err) {
                    return reject(new Error(`[Master] Cannot listen at port ${this._config.port} : ${err.toString()}`));
                }

                winston.info('Proxy is listening at http://localhost:%d', this._config.port);

                return resolve();
            });
        });
    }

    shutdown() {
        winston.debug('[Master] shutdown');

        return this._server.close();
    }
};

function createProxyOpts(target) {
    const opts = _.pick(
        url.parse(target),
        'protocol', 'hostname', 'port', 'path'
    );

    if (opts.protocol && opts.protocol === 'https:') {
        opts.ssl = true; // HTTPS over HTTP
    }
    else {
        opts.ssl = false; // HTTP
    }
    delete opts.protocol;

    if (!opts.port) {
        if (opts.ssl) {
            opts.port = 443;
        }
        else {
            opts.port = 80;
        }
    }

    return opts;
}

function writeEnd(r, code, message, opts) {
    r.writeHead(code, opts);
    return r.end(message);
}

function onRequest(ctx, callback) {
    const proxyReq = ctx.clientToProxyRequest;

    if (this._token) {
        if (!proxyReq.headers['proxy-authorization'] || proxyReq.headers['proxy-authorization'] !== this._token) {
            winston.error('[Master] Rejected request with invalid proxy credentials');
            return writeEnd(ctx.proxyToClientResponse, 407, '[Master] Error: Wrong proxy credentials', {
                'Proxy-Authenticate': 'Basic realm="Scrapoxy"',
                'Content-Type': 'text/plain',
            });
        }
    }

    this._manager.requestReceived();

    let start;
    ctx.onRequestEnd((reqCtx, reqCallback) => {
        start = process.hrtime();
        return reqCallback();
    });

    ctx.onResponse((respCtx, respCallback) => {
        respCtx.proxyToClientResponse.setHeader('x-cache-proxyname', respCtx.instance.name);
        return respCallback();
    });

    ctx.onResponseEnd((respCtx, respCallback) => {
        const duration = process.hrtime(start);
        this._stats.requestEnd(
            duration,
            ctx.serverToProxyResponse.socket._bytesDispatched,
            ctx.serverToProxyResponse.socket.bytesRead
        );

        respCtx.instance.incrRequest();

        return respCallback();
    });

    return callback();
}

function onRequestHeaders(ctx, callback) {
    const proxyReq = ctx.clientToProxyRequest;

    const uri = domain.convertHostnamePathToUri(proxyReq.headers.host, proxyReq.url, ctx.isSSL);
    const basedomain = domain.getBaseDomainForUri(uri);

    const forceName = proxyReq.headers['x-cache-proxyname'];
    const instance = this._manager.getNextRunningInstanceForDomain(basedomain, forceName);

    if (!instance) {
        winston.error('[Master] Error: No running instance found');
        return writeEnd(ctx.proxyToClientResponse, 407, '[Master] Error: No running instance found');
    }

    ctx.instance = instance;

    const reqOpts = ctx.proxyToServerRequestOptions;
    const proxyOpts = createProxyOpts(uri);

    delete reqOpts.headers['x-cache-proxyname'];
    reqOpts.agent = this._proxyAgent;
    reqOpts.proxy = instance.proxyParameters;
    Object.assign(reqOpts, proxyOpts);

    ctx.proxyToClientResponse.setHeader('x-cache-proxyname', instance.name);

    // Disable SSL here, because master -> proxy is http
    ctx.isSSL = false;

    return callback();
}

function onProxyError(ctx, err, errorKind) {
    winston.error(`[Master] ${errorKind}`, err);
}
