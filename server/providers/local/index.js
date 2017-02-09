'use strict';

const _ = require('lodash'),
    Promise = require('bluebird'),
    child_process = require('child_process'),
    InstanceModel = require('../../proxies/manager/instance.model'),
    winston = require('winston');


module.exports = class ProviderLocal {
    constructor() {
        this.name = 'local';

        this._portIncr = 0;

        this._locals = new Map();
    }


    get models() {
        return new Promise((resolve) => {
            const models = Array.from(this._locals.values())
                .map((local) => {
                    const address = {
                        hostname: 'localhost',
                        port: local.port,
                    };

                    return new InstanceModel(
                        local.name,
                        this.name,
                        InstanceModel.STARTED,
                        false,
                        address,
                        local
                    );
                });

            resolve(models);
        });
    }


    createInstances(count) {
        const self = this;

        winston.debug('[ProviderLocal] createInstances: count=%d', count);

        return createLocals(count)
            .map(
            (local) => self
                ._startInstance(local)
                .then((l) => self._locals.set(l.name, l))
        );


        ////////////

        function createLocals(c) {
            return new Promise((resolve) => {
                const locals = [];
                for (let i = 0; i < c; ++i) {
                    const port = self._getNextPort();

                    const local = {
                        port,
                        name: `proxy${port}`,
                    };

                    locals.push(local);
                }

                resolve(locals);
            });
        }
    }


    startInstance(model) {
        winston.debug('[ProviderLocal] startInstance: model=', model.toString());

        const local = model.providerOpts;
        if (local.child) {
            throw new Error('Cannot start a started instance');
        }

        local.port = this._getNextPort();

        const newaddress = {
            hostname: 'localhost',
            port: local.port,
        };
        model.address = newaddress;

        return this._startInstance(local);
    }


    removeInstance(model) {
        winston.debug('[ProviderLocal] removeInstance: model=', model.toString());

        return new Promise((resolve) => {
            const local = model.providerOpts;
            if (!local.child || local.child.killed) {
                resolve();
            }

            local.child.on('close', () => resolve());

            local.child.kill();
            local.child = void 0;
        })
        .then(() => {
            this._locals.delete(model.providerOpts.name);
        });
    }


    removeInstances(models) {
        winston.debug('[ProviderLocal] removeInstances: models=',
            _.map(models, (model) => model.toString())
        );

        return Promise.map(models, (model) => {
            this._locals.delete(model.providerOpts.name);

            return this.removeInstance(model);
        });
    }


    _startInstance(local) {
        winston.debug('[ProviderLocal] _startInstance: local=', local);

        return new Promise((resolve) => {
            const child = child_process.exec(`node ./server/providers/local/proxy/index.js ${local.name} ${local.port}`);
            child.stdout.on(
                'data',
                (data) => winston.debug('[ProviderLocal/%s] (stdout) %s', local.name, data)
            );

            child.stderr.on(
                'data',
                (data) => winston.debug('[ProviderLocal/%s] (stderr) %s', local.name, data)
            );

            child.on(
                'close',
                () => winston.debug('[ProviderLocal/%s] Close', local.name)
            );

            local.child = child;

            resolve(local);
        });
    }


    _getNextPort() {
        const port = this._portIncr;

        ++this._portIncr;
        if (this._portIncr > 1000) {
            this._portIncr = 0;
        }

        return 30000 + port;
    }
};
