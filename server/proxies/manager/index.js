'use strict';

const _ = require('lodash'),
    Promise = require('bluebird'),
    EventEmitter = require('events').EventEmitter,
    Instance = require('./instance'),
    ScalingError = require('../../common/error/scaling'),
    winston = require('winston');


module.exports = class Manager extends EventEmitter {
    constructor(config, stats, provider) {
        super();

        this._config = config;
        this._stats = stats;
        this._provider = provider;

        this._managedInstances = new Map();
        this._aliveInstances = [];
        this._aliveInstancesMap = new Map();

        this._domains = new Map();

        this._config.scaling.required = this._config.scaling.required || this._config.scaling.min;
    }


    get instances() {
        return Array.from(this._managedInstances.values());
    }


    get aliveInstances() {
        return this._aliveInstances;
    }


    get stats() {
        return this.instances.map((i) => i.stats);
    }


    waitForAliveInstances(count) {
        winston.debug('[Manager] waitForAliveInstances: count=%d', count);

        if (this._aliveInstances.length === count) {
            return Promise.resolve();
        }
        else {
            return Promise
                .delay(2000)
                .then(() => this.waitForAliveInstances(count));
        }
    }


    start() {
        const self = this;

        winston.debug('[Manager] start');

        self._checkIntervalTimeout = setInterval(checkInstances, self._config.checkDelay);


        ////////////

        function checkInstances() {
            winston.debug('[Manager] checkInstances');

            self._provider.models
                .then(updateInstances)
                .then(adjustInstances)
                .catch((err) => {
                    if (err instanceof ScalingError) {
                        self.emit('scaling:error', err);
                    }

                    winston.error('[Manager] Error: Cannot update or adjust instances:', err);
                });


            ////////////

            function updateInstances(models) {
                const existingNames = Array.from(self._managedInstances.keys());

                models.forEach((model) => {
                    const name = model.name;

                    let instance = self._managedInstances.get(name);
                    if (instance) {
                        // Modify
                        instance.model = model;

                        const idx = existingNames.indexOf(name);
                        if (idx >= 0) {
                            existingNames.splice(idx, 1);
                        }
                    }
                    else {
                        // Add
                        winston.debug('[Manager] checkInstances: add:', model.toString());

                        instance = new Instance(self, self._stats, self._provider, self._config);
                        self._managedInstances.set(name, instance);

                        registerEvents(instance);

                        instance.model = model;
                    }
                });

                // Remove
                existingNames.forEach((name) => {
                    const instance = self._managedInstances.get(name);

                    winston.debug('[Manager] checkInstances: remove:', instance.model.toString());

                    self._managedInstances.delete(name);

                    instance.removedFromManager();
                });
            }

            function registerEvents(instance) {
                instance.on('status:updated', () => self.emit('status:updated', instance.stats));

                instance.on('alive:updated', (alive) => {
                    const name = instance.name;
                    if (alive && !instance.removing) {
                        self._aliveInstances.push(instance);
                        self._aliveInstancesMap.set(name, instance);
                    }
                    else {
                        // If instance is not alive OR instance is alived but is asked to be removed
                        // we remove the instance from the alive pool
                        const idx = self._aliveInstances.indexOf(instance);
                        if (idx >= 0) {
                            self._aliveInstances.splice(idx, 1);
                        }

                        self._aliveInstancesMap.delete(name);
                    }

                    self.emit('alive:updated', instance.stats);
                });
            }

            function adjustInstances() {
                const managedCount = self._managedInstances.size;
                winston.debug('[Manager] adjustInstances: required:%d / actual:%d', self._config.scaling.required, managedCount);

                if (managedCount > self._config.scaling.required) {
                    // Too much
                    const count = managedCount - self._config.scaling.required;

                    winston.debug('[Manager] adjustInstances: remove %d instances', count);

                    const instances =_(Array.from(self._managedInstances.values()))
                        .sample(count)
                        .filter((instance) => !instance.model.locked) // only unlocked instance can be removed
                        .value();
                    return Promise.map(instances, (instance) => instance.remove());
                }
                else if (managedCount < self._config.scaling.required) {
                    // Not enough
                    const count = self._config.scaling.required - managedCount;

                    winston.debug('[Manager] adjustInstances: add %d instances', count);

                    return self._provider.createInstances(count);
                }
            }
        }
    }


    /**
     * For testing purpose
     */
    crashRandomInstance() {
        const names = Array.from(this._managedInstances.keys());

        const randomName = names[Math.floor(Math.random() * names.length)];

        winston.debug('[Manager] crashRandomInstance: name=%s', randomName);

        const instance = this._managedInstances.get(randomName);

        return this._provider.removeInstances([instance.model]);
    }


    stop() {
        const self = this;

        winston.debug('[Manager] stop');

        self._config.scaling.required = 0;
        self.emit('scaling:updated', self._config.scaling);

        return waitForNoInstance()
            .then(() => {
                if (self._checkIntervalTimeout) {
                    clearInterval(self._checkIntervalTimeout);
                }
            });


        ////////////

        function waitForNoInstance() {
            return new Promise((resolve) => {
                checkNoInstance();


                ////////////

                function checkNoInstance() {
                    const managedCount = self._managedInstances.size;
                    if (managedCount <= 0) {
                        resolve();
                    }
                    else {
                        setTimeout(checkNoInstance, self._config.checkDelay);
                    }
                }
            });
        }
    }


    getNextRunningInstanceForDomain(domain, forceName) {
        const self = this;

        if (self._aliveInstances.length <= 0) {
            return;
        }

        domain = domain || '';

        let nextInstance;
        if (forceName) {
            nextInstance = self._aliveInstancesMap.get(forceName);
        }

        if (!nextInstance) {
            const actualInstance = self._domains.get(domain);

            nextInstance = getNextRunningInstance(actualInstance);
        }

        self._domains.set(domain, nextInstance);

        return nextInstance;


        ////////////

        function getNextRunningInstance(instance) {
            if (self._aliveInstances.length <= 0) {
                return;
            }

            let idx;
            if (instance) {
                idx = self._aliveInstances.indexOf(instance);
                if (idx >= 0) {
                    ++idx;
                    if (idx >= self._aliveInstances.length) {
                        idx = 0;
                    }
                }
                else {
                    idx = 0;
                }
            }
            else {
                idx = 0;
            }

            if (idx >= self._aliveInstances.length) {
                return;
            }

            return self._aliveInstances[idx];
        }
    }


    /*
    getFirstInstance(forceName) {
        if (this._aliveInstances.length <= 0) {
            return;
        }

        let nextInstance;
        if (forceName) {
            nextInstance = this._aliveInstancesMap.get(forceName);
        }

        if (!nextInstance) {
            nextInstance = this._aliveInstances[0];
        }

        return nextInstance;
    }
    */


    requestReceived() {
        if (this._config.scaling.required <= 0) {
            // Shutdown
            return;
        }

        if (this._config.scaling.required !== this._config.scaling.max) {
            this._config.scaling.required = this._config.scaling.max;
            this.emit('scaling:updated', this._config.scaling);
        }

        if (this._scaleDownTimeout) {
            clearTimeout(this._scaleDownTimeout);
        }

        this._scaleDownTimeout = setTimeout(() => {
            this._config.scaling.required = this._config.scaling.min;
            this.emit('scaling:updated', this._config.scaling);
        }, this._config.scaling.downscaleDelay);
    }


    removeInstance(name) {
        const instance = this._managedInstances.get(name);
        if (!instance) {
            return;
        }

        return instance.remove();
    }
};
