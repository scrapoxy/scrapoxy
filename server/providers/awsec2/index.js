'use strict';

const _ = require('lodash'),
    Promise = require('bluebird'),
    AWS = require('aws-sdk'),
    InstanceModel = require('../../proxies/manager/instance.model'),
    ScalingError = require('../../common/error/scaling'),
    winston = require('winston');


module.exports = class ProviderAWSEC2 {
    constructor(config, instancePort) {
        if (!config || !instancePort) {
            throw new Error('[ProviderAWSEC2] should be instanced with config and instancePort');
        }

        this._config = config;
        this._config.tag = this._config.tag || 'Proxy';

        this._instancePort = instancePort;

        this.name = 'awsec2';

        const opts = _.pick(this._config, ['accessKeyId', 'secretAccessKey', 'region']);
        this._ec2 = new AWS.EC2(opts);

        // Remove instances in batch every second
        this._modelsToRemove = [];
        setInterval(() => {
            if (this._modelsToRemove.length <= 0) {
                return;
            }

            const models = this._modelsToRemove;
            this._modelsToRemove = [];

            this
                ._removeInstances(models)
                .catch((err) => {
                    const names = models.map((model) => model.toString()).join(',');
                    winston.error('[ProviderAWSEC2] Error: Cannot remove instances %s:', names, err);
                })
            ;
        }, 1000);
    }


    static get ST_PENDING() {
        return 'pending';
    }

    static get ST_RUNNING() {
        return 'running';
    }

    static get ST_SHUTTING_DOWN() {
        return 'shutting-down';
    }

    static get ST_TERMINATED() {
        return 'terminated';
    }

    static get ST_STOPPING() {
        return 'stopping';
    }

    static get ST_STOPPED() {
        return 'stopped';
    }


    get region() {
        return this._config.region;
    }


    get models() {
        const self = this;

        return describeInstances()
            .then(summarizeInfo)
            .then(excludeTerminated)
            .then(excludeOutscope)
            .then(convertToModel);


        ////////////


        function describeInstances() {
            return new Promise((resolve, reject) => {
                self._ec2.describeInstances({}, (err, data) => {
                    if (err) {
                        return reject(err);
                    }

                    const instances = _(data.Reservations)
                        .map('Instances')
                        .flatten()
                        .value();

                    resolve(instances);
                });
            });
        }

        function summarizeInfo(instancesDesc) {
            return _.map(instancesDesc, (instanceDesc) => ({
                    id: instanceDesc.InstanceId,
                    status: instanceDesc.State.Name,
                    ip: instanceDesc.PublicIpAddress,
                    tag: getTag(instanceDesc),
            }));

            ////////////

            function getTag(instanceDesc) {
                if (!instanceDesc.Tags) {
                    return;
                }

                const first = _(instanceDesc.Tags)
                    .filter((tag) => tag.Key === 'Name')
                    .first();

                if (!first) {
                    return;
                }

                return first.Value;
            }
        }

        function excludeTerminated(instancesDesc) {
            return _.filter(instancesDesc,
                (instanceDesc) =>
                instanceDesc.status !== ProviderAWSEC2.ST_TERMINATED &&
                instanceDesc.status !== ProviderAWSEC2.ST_SHUTTING_DOWN
            );
        }

        function excludeOutscope(instancesDesc) {
            return _.filter(instancesDesc,
                (instanceDesc) => instanceDesc.tag && instanceDesc.tag.indexOf(self._config.tag) === 0
            );
        }

        function convertToModel(instancesDesc) {
            return _.map(instancesDesc, (instanceDesc) => new InstanceModel(
                instanceDesc.id,
                self.name,
                convertStatus(instanceDesc.status),
                false,
                buildAddress(instanceDesc.ip),
                self.region,
                instanceDesc
            ));


            ////////////

            function buildAddress(ip) {
                if (!ip) {
                    return;
                }

                return {
                    hostname: ip,
                    port: self._instancePort,
                };
            }

            function convertStatus(status) {
                switch (status) {
                    case ProviderAWSEC2.ST_PENDING:
                    {
                        return InstanceModel.STARTING;
                    }
                    case ProviderAWSEC2.ST_RUNNING:
                    {
                        return InstanceModel.STARTED;
                    }
                    case ProviderAWSEC2.ST_STOPPED:
                    {
                        return InstanceModel.STOPPED;
                    }
                    case ProviderAWSEC2.ST_STOPPING:
                    {
                        return InstanceModel.STOPPING;
                    }
                    default:
                    {
                        winston.error('[ProviderAWSEC2] Error: Found unknown status:', status);

                        return InstanceModel.ERROR;
                    }
                }
            }
        }
    }


    createInstances(count) {
        const self = this;

        winston.debug('[ProviderAWSEC2] createInstances: count=%d', count);

        return createInstances(self._config.instance, count)
            .then((ids) => Promise.delay(1000, ids))
            .then((ids) => tagInstances(ids, self._config.tag))
            .catch((err) => {
                if (err.code === 'InstanceLimitExceeded') {
                    throw new ScalingError(count, false);
                }

                throw err;
            })
        ;


        ////////////

        function createInstances(instanceConfig, cnt) {
            return new Promise((resolve, reject) => {
                const runParams = _.merge({}, instanceConfig, {
                    MinCount: cnt,
                    MaxCount: cnt,
                    InstanceInitiatedShutdownBehavior: 'terminate',
                    InstanceMarketOptions: {
                        MarketType: "spot",
                        SpotOptions:{
                            InstanceInterruptionBehavior: "terminate",
                            SpotInstanceType: "one-time"
                        }
                    },
                    Monitoring: {
                        Enabled: false,
                    },
                });

                self._ec2.runInstances(runParams, (errParams, dataRun) => {
                    if (errParams) {
                        return reject(errParams);
                    }

                    const ids = _.map(dataRun.Instances, 'InstanceId');
                    return resolve(ids);
                });
            });
        }

        function tagInstances(ids, tag) {
            return new Promise((resolve, reject) => {
                const tagsParams = {
                    Resources: ids,
                    Tags: [{
                        'Key': 'Name',
                        'Value': tag,
                    }],
                };

                self._ec2.createTags(tagsParams, (errTags) => {
                    if (errTags) {
                        return reject(errTags);
                    }

                    return resolve();
                });
            });
        }
    }


    startInstance(model) {
        winston.debug('[ProviderAWSEC2] startInstance: model=', model.toString());

        return new Promise((resolve, reject) => {
            const params = {
                'InstanceIds': [model.providerOpts.id],
            };

            this._ec2.startInstances(params, (err) => {
                if (err) {
                    return reject(err);
                }

                resolve();
            });
        });
    }


    removeInstance(model) {
        winston.debug('[ProviderAWSEC2] removeInstance (asked): model=', model.toString());

        this._modelsToRemove.push(model);

        return Promise.resolve();
    }


    _removeInstances(models) {
        const
            ids = models.map((model) => model.providerOpts.id),
            names = models.map((model) => model.toString()).join(',');

        winston.debug('[ProviderAWSEC2] removeInstances: models=', names);

        return new Promise((resolve, reject) => {
            const params = {
                'InstanceIds': ids,
            };

            this._ec2.terminateInstances(params, (err) => {
                if (err) {
                    return reject(err);
                }

                return resolve();
            });
        });
    }
};
