'use strict';

const Promise = require('bluebird'),
    http = require('http'),
    net = require('net'),
    url = require('url'),
    winston = require('winston');


module.exports = class LocalProxy {
    constructor(name, port) {
        const self = this;

        self._name = name;
        self._port = port;

        // HTTP Agent
        self._agent = new http.Agent();

        // Config server
        self._server = http.createServer();

        self._server.on('connect', connectFn);

        // Response to PING on GET /ping
        self._server.on('request', (req, res) => {
            if (req.method === 'GET' && req.url === '/ping') {
                setTimeout(() => {
                    res.statusCode = 200;
                    res.end();
                }, 1000);
            }
            else {
                res.statusCode = 404;
                res.end();
            }
        });


        ////////////

        function connectFn(req, socket, head) {
            winston.debug('[LocalProxy/%s] connect (%s) %s %s', self._name, req.connection.remoteAddress, req.method, req.url);

            const srvUrl = url.parse(`http://${req.url}`);

            const proxy_socket = net.connect(srvUrl.port, srvUrl.hostname, () => {
                socket.write('HTTP/1.1 200 Connection established\r\n\r\n');

                proxy_socket.write(head);
                proxy_socket.pipe(socket);
                socket.pipe(proxy_socket);
            });

            socket.on('error', (err) => {
                winston.error('[LocalProxy/%s] connect (error client) %s => %s', self._name, req.url, err.toString());

                proxy_socket.end();
            });

            proxy_socket.on('error', (err) => {
                winston.error('[LocalProxy/%s] connect (error proxy) %s => %s', self._name, req.url, err.toString());

                socket.end();
            });
        }
    }


    listen() {
        winston.debug('[LocalProxy/%s] proxy listen at port %d', this._name, this._port);

        return new Promise((resolve, reject) => {
            this._server.listen(this._port, (err) => {
                if (err) {
                    return reject(err);
                }

                resolve();
            });
        });
    }


    shutdown() {
        winston.debug('[LocalProxy/%s] shutdown proxy listen at port %d', this._name, this._port);

        this._server.close();
    }
};
