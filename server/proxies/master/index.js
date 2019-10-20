'use strict';

const _ = require('lodash'),
    Promise = require('bluebird'),
    domain = require('./domain'),
    fs = require('fs'),
    http = require('http'),
    Mitm = require('./mitm'),
    path = require('path'),
    ProxyAgent = require('./proxy-agent'),
    sanitize = require('./sanitize'),
    url = require('url'),
    winston = require('winston');


module.exports = class Master {
    constructor(config, manager, stats) {
        const self = this;

        self._config = config;
        self._manager = manager;
        self._stats = stats;

        // Proxy Auth
        if (self._config.auth &&
            self._config.auth.username &&
            self._config.auth.password) {
            winston.debug("[Master] Found credentials with username '%s'", self._config.auth.username);

            const usernamePasswordB64 = new Buffer(`${self._config.auth.username}:${self._config.auth.password}`).toString('base64');
            self._token = `Basic ${usernamePasswordB64}`;
        }

        // HTTP Agent
        self._agent = new http.Agent();
        self._proxyAgent = new ProxyAgent({
            agent: self._agent,
        });

        // Domains
        self._domainsAllowed = (self._config.domains_allowed || []).map(d => d.toLowerCase());
        self._domainsForbidden = (self._config.domains_forbidden || []).map(d => d.toLowerCase());

        // Mitm
        if (self._config.mitm) {
            let cert;
            if (self._config.mitm.cert_filename) {
                cert = fs.readFileSync(self._config.mitm.cert_filename);
            }
            else {
                cert = fs.readFileSync(path.join(__dirname, 'mitm/cert.pem'));
            }

            let key;
            if (self._config.mitm.key_filename) {
                key = fs.readFileSync(self._config.mitm.key_filename);
            }
            else {
                key = fs.readFileSync(path.join(__dirname, 'mitm/key.pem'));
            }

            self._mitm = new Mitm({cert, key});
        }

        // Config server
        self._server = http.createServer();

        self._server.on('request', request);
        self._server.on('connect', connect);


        ////////////

        function request(req, res) {
            // Check auth
            if (self._token) {
                if (!req.headers['proxy-authorization'] || req.headers['proxy-authorization'] !== self._token) {
                    return writeEndRequest(res, 407, '[Master] Error: Wrong proxy credentials', {
                        'Proxy-Authenticate': 'Basic realm="Scrapoxy"',
                        'Content-Type': 'text/plain',
                    });
                }
            }

            return requestImpl(req, res);
        }

        function requestImpl(req, res) {
            // Log errors
            req.on('error',
                (err) => {
                    winston.error('[Master] Error: request error from client (%s %s on instance %s):', req.method, req.url, instance.toString(), err);
                }
            );

            res.on('error',
                (err) => {
                    winston.error('[Master] Error: response error from client (%s %s on instance %s):', req.method, req.url, instance.toString(), err);
                }
            );

            // Check requested url against rules
            if (isUrlForbidden(req.url)) {
                return writeEndRequest(res, 407, '[Master] Error: request is forbidden by url rule');
            }

            // Trigger scaling if necessary
            self._manager.requestReceived();

            // Get domain
            const uri = domain.convertHostnamePathToUri(req.hostname, req.url),
                basedomain = domain.getBaseDomainForUri(uri);

            // Find instance
            const forceName = req.headers['x-cache-proxyname'],
                instance = self._manager.getNextRunningInstanceForDomain(basedomain, forceName);

            if (!instance) {
                return writeEndRequest(res, 407, '[Master] Error: No running instance found');
            }

            // Update headers
            instance.updateRequestHeaders(req.headers);

            // Remove Master auth credentials, if present, as they would otherwise leak to external hosts
            delete req.headers['proxy-authorization'];

            // Make request
            const proxyOpts = _.merge(createProxyOpts(req.url), {
                method: req.method,
                headers: req.headers,
                agent: self._proxyAgent,
                proxy: instance.proxyParameters,
            });

            const proxy_req = http.request(proxyOpts);

            proxy_req.on('error', (err) => {
                winston.error('[Master] Error: request error from target (%s %s on instance %s):', req.method, req.url, instance.toString(), err);

                return writeEndRequest(res, 500, `[Master] Error: request error from target (${req.method} ${req.url} on instance ${instance.toString()}): ${err.toString()}`);
            });

            // Start timer
            const start = process.hrtime();

            proxy_req.on('response', (proxy_res) => {
                proxy_res.on('error', (err) => {
                    winston.error('[Master] Error: response error from target (%s %s on instance %s):', req.method, req.url, instance.toString(), err);

                    return writeEndRequest(res, 500, `[Master] Error: response error from target (${req.method} ${req.url} on instance ${instance.toString()}): ${err.toString()}`);
                });

                proxy_res.on('end', () => {
                    // Stop timer and record duration
                    const duration = process.hrtime(start);

                    self._stats.requestEnd(
                        duration,
                        proxy_res.socket._bytesDispatched,
                        proxy_res.socket.bytesRead
                    );

                    instance.incrRequest();
                });

                const cleanHeaders = sanitize.headers(proxy_res.headers);
                instance.updateResponseHeaders(cleanHeaders);

                res.writeHead(proxy_res.statusCode, cleanHeaders);

                proxy_res.pipe(res);
            });

            req.pipe(proxy_req);


            ////////////

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
        }

        function connect(req, socket) {
            // Check auth
            if (self._token) {
                if (!req.headers['proxy-authorization'] || req.headers['proxy-authorization'] !== self._token) {
                    return writeEndSocket(socket, 407, '[Master] Error: Wrong proxy credentials', {
                        'Proxy-Authenticate': 'Basic realm="Scrapoxy"',
                        'Connection': 'close',
                    });
                }
            }

            // Log errors
            req.on('error',
                (err) => {
                    winston.error('[Master] Error: request error from client (%s %s on instance %s):', req.method, req.url, instance.toString(), err);
                }
            );

            socket.on('error',
                (err) => {
                    winston.error('[Master] Error: socket error from client (%s %s on instance %s):', req.method, req.url, instance.toString(), err);
                }
            );

            if (self._mitm) {
                return self._mitm.connect(socket, (rq, rs) => requestImpl(rq, rs));
            }

            // Check requested url against rules
            if (isUrlForbidden(req.url)) {
                return writeEndSocket(socket, 407, '[Master] Error: request is forbidden by url rule');
            }

            // Trigger scaling if necessary
            self._manager.requestReceived();

            // Get domain
            const target = parseTarget(req.url),
                uri = domain.convertHostnamePathToUri(target.hostname, target.url),
                basedomain = domain.getBaseDomainForUri(uri);

            // Find instance
            const forceName = req.headers['x-cache-proxyname'],
                instance = self._manager.getNextRunningInstanceForDomain(basedomain, forceName);

            if (!instance) {
                return writeEndSocket(socket, 407, '[Master] Error: No running instance found');
            }

            // Cannot update headers because SSL is encrypted

            // Make request
            const proxyParameters = instance.proxyParameters;
            const proxyOpts = {
                host: proxyParameters.hostname,
                port: proxyParameters.port,
                method: 'CONNECT',
                path: req.url,
                agent: self._agent, // Don't use the proxy agent
                headers: {},
            };

            if (proxyParameters.username && proxyParameters.password) {
                const usernamePasswordB64 = new Buffer(`${proxyParameters.username}:${proxyParameters.password}`).toString('base64');
                proxyOpts.headers['proxy-authorization'] = `Basic ${usernamePasswordB64}`;
            }

            const proxy_req = http.request(proxyOpts);

            proxy_req.on('error', (err) => {
                winston.error('[Master] Error: request error from client (%s %s on instance %s):', req.method, req.url, instance.toString(), err);

                return writeEndSocket(socket, 500, `[Master] Error: request error from target (${req.method} ${req.url} on instance ${instance.toString()}): ${err.toString()}`);
            });

            // Start timer
            const start = process.hrtime();

            proxy_req.on('connect', (instance_req, proxy_socket) => {
                proxy_socket.on('error', (err) => {
                    winston.error('[Master] Error: response error from target (%s %s on instance %s):', req.method, req.url, instance.toString(), err);

                    return writeEndSocket(socket, 500, `[Master] Error: response error from target (${req.method} ${req.url} on instance ${instance.toString()}): ${err.toString()}`);
                });

                proxy_socket.on('end', () => {
                    // Stop timer and record duration
                    const duration = process.hrtime(start);

                    self._stats.requestEnd(
                        duration,
                        proxy_socket._bytesDispatched,
                        proxy_socket.bytesRead
                    );

                    instance.incrRequest();
                });

                socket.write('HTTP/1.1 200 Connection established\r\n\r\n');

                proxy_socket.pipe(socket).pipe(proxy_socket);
            });

            proxy_req.end();


            ////////////

            function parseTarget(reqUrl) {
                if (!reqUrl) {
                    return {
                        hostname: '',
                        port: '',
                    };
                }

                const part = reqUrl.split(':');
                if (part.length !== 2) {
                    return {
                        hostname: '',
                        port: '',
                    };
                }

                const hostname = part[0],
                    port = parseInt(part[1]);

                if (!hostname ||
                    hostname.length <= 0 ||
                    !port) {
                    return {
                        hostname: '',
                        port: '',
                    };
                }

                return {hostname, port};
            }
        }

        function isUrlForbidden(url) {
            let rUrl;
            if (!url) {
                rUrl = '';
            }
            else {
                rUrl = url.toLowerCase();
            }

            if (self._domainsForbidden.length > 0) {
                if (found(rUrl, self._domainsForbidden)) {
                    return true;
                }
            }

            if (self._domainsAllowed.length > 0) {
                if (!found(rUrl, self._domainsAllowed)) {
                    return true;
                }
            }

            return false;


            ////////////

            function found(u, domains) {
                for (const domain of domains) {
                    if (u.indexOf(domain) >= 0) {
                        return true;
                    }
                }

                return false;
            }
        }

        function writeEndRequest(r, code, message, opts) {
            r.writeHead(code, opts);
            return r.end(message);
        }

        function writeEndSocket(s, code, message, opts) {
            let text = `HTTP/1.1 ${code}`;

            if (message && message.length >= 0) {
                text += ` ${message}`;
            }

            if (opts) {
                _.forEach(opts, (val, key) => {
                    text += `\r\n${key}: ${val}`;
                });
            }

            text += '\r\n\r\n';

            s.write(text);
            return s.end();
        }
    }


    listen() {
        return new Promise((resolve, reject) => {
            this._server.listen(this._config.port, (err) => {
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

        this._server.close();
    }
};
