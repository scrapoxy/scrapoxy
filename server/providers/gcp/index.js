/* eslint-disable linebreak-style */
'use strict';

const _ = require('lodash'),
  Promise = require('bluebird'),
  GCPCompute = require('@google-cloud/compute'),
  InstanceModel = require('../../proxies/manager/instance.model'),
  ScalingError = require('../../common/error/scaling'),
  winston = require('winston');
  // const {GoogleAuth} = require('google-auth-library');
      

module.exports = class ProviderGCP {
  constructor(config, instancePort) {
    if (!config || !instancePort) {
      throw new Error(
        '[ProviderGCP] should be instanced with config and instancePort'
      );
    }

    this._config = config;
    winston.debug('[ProviderGCP] config:', config);
    this._config.tag = this._config.tag || 'Proxy';

    this._instancePort = instancePort;

    this.name = 'GCP';

    // const opts = _.pick(this._config, [
    //   'accessKeyId',
    //   'secretAccessKey',
    //   'region',
    // ]);
    // this._ec2 = new GCPCompute.EC2(opts);
    // this._configureClient();
    this._compute = new GCPCompute();
    this._zone = this._compute.zone(this._config.region);
    // Remove instances in batch every second
    this._modelsToRemove = [];
    setInterval(() => {
      if (this._modelsToRemove.length <= 0) {
        return;
      }

      const models = this._modelsToRemove;
      this._modelsToRemove = [];

      this._removeInstances(models).catch((err) => {
        const names = models.map((model) => model.toString()).join(',');
        winston.error(
          '[ProviderGCP] Error: Cannot remove instances %s:',
          names,
          err
        );
      });
    }, 1000);
  }

  // _configureClient() {
  //   const self = this;
  //   async function doConfigure() {
  //     const auth = new GoogleAuth({
  //       scopes: 'https://www.googleapis.com/auth/cloud-platform',
  //     });
  //     self._client = await auth.getClient();
  //     self._projectId = await auth.getProjectId();
  //   }
  //   doConfigure();
  // }

  static get ST_PENDING() {
    return 'PROVISIONING';
  }

  static get ST_RUNNING() {
    return 'RUNNING';
  }

  static get ST_SHUTTING_DOWN() {
    return 'SUSPENDING';
  }

  static get ST_TERMINATED() {
    return 'TERMINATED';
  }

  static get ST_STOPPING() {
    return 'STOPPING';
  }

  static get ST_STOPPED() {
    return 'STOPPED';
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

        self._zone.getVMs({autoPaginate: false}, (err, vms, apiResponse) => {
          if (err) {
            return reject(err);
          }
          winston.debug('[ProviderGCP] describeInstances get VMs:', _.map(vms, "name"));
          resolve(vms);
        });
      });
    }

    function summarizeInfo(instancesDesc) {
      return _.map(instancesDesc, (instanceDesc) => {
        // winston.debug('[ProviderGCP] summarizeInfo:', instanceDesc);
        const summary = {
          id: instanceDesc.id,
          status: instanceDesc.metadata.status,
          ip: instanceDesc.metadata.networkInterfaces[0].accessConfigs[0].natIP,
          tag: getTag(instanceDesc),
        };
        winston.debug('[ProviderGCP] summarizeInfo:', summary);
        return summary;
    });

      ////////////

      function getTag(instanceDesc) {
        if (!instanceDesc.metadata.tags) {
          return;
        }

        return instanceDesc.metadata.tags.items;
      }
    }

    function excludeTerminated(instancesDesc) {
      return _.filter(
        instancesDesc,
        (instanceDesc) =>
          instanceDesc.status !== ProviderGCP.ST_TERMINATED &&
          instanceDesc.status !== ProviderGCP.ST_SHUTTING_DOWN
      );
    }

    function excludeOutscope(instancesDesc) {
      return _.filter(
        instancesDesc,
        (instanceDesc) =>
          instanceDesc.tag && instanceDesc.tag.indexOf(self._config.tag) >= 0
      );
    }

    function convertToModel(instancesDesc) {
      winston.debug('[ProviderGCP] convertToModel:', instancesDesc.length);
      return _.map(
        instancesDesc,
        (instanceDesc) =>
          new InstanceModel(
            instanceDesc.id,
            self.name,
            convertStatus(instanceDesc.status),
            false,
            buildAddress(instanceDesc.ip),
            self.region,
            instanceDesc
          )
      );

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
        switch (status.toUpperCase()) {
          case ProviderGCP.ST_PENDING: {
            return InstanceModel.STARTING;
          }
          case ProviderGCP.ST_RUNNING: {
            return InstanceModel.STARTED;
          }
          case ProviderGCP.ST_STOPPED: {
            return InstanceModel.STOPPED;
          }
          case ProviderGCP.ST_STOPPING: {
            return InstanceModel.STOPPING;
          }
          default: {
            winston.error('[ProviderGCP] Error: Found unknown status:', status);

            return InstanceModel.ERROR;
          }
        }
      }
    }
  }

  createInstances(count) {
    const self = this;

    winston.debug('[ProviderGCP] createInstances: count=%d', count);

    return createInstances(self._config.instance, count)
      .then((ids) => Promise.delay(1000, ids))
      // .then((ids) => tagInstances(self._zone, ids, self._config.tag))
      .catch((err) => {
        if (err.code === 'InstanceLimitExceeded') {
          throw new ScalingError(count, false);
        }

        throw err;
      });


      async function _createVM(zone, vmName, config) {
        const [vm, operation] = await zone.createVM(vmName, config);
        winston.debug('[ProviderGCP] createInstances: new VM', vm.name);
        await operation.promise();
        winston.debug('[ProviderGCP] createInstances: VM created successfully');
        return vm.id;
      }

      // async function _createVM(zone, vmName, templateName, config) {
      //   const sourceInstanceTemplate = `projects/${self._projectId}/global/instanceTemplates/${templateName}`;
      //   const url = `https://www.googleapis.com/compute/v1/projects/${self._projectId}/zones/${zone}/instances?sourceInstanceTemplate=${sourceInstanceTemplate}`;
      //   const body = _.merge({}, config, {name: vmName});

      //   return await self._client.request({
      //     url,
      //     method: 'post',
      //     data: body,
      //   });
      // }
    function createInstances(instanceConfig, cnt) {

      return self.models.then((instances) => new Promise((resolve, reject) => {
          const vmPromises = [];
          const instanceCount = instances.length;
          // const templateName = self._config.templateName;
          _.times(cnt, (n) => {
              vmPromises.push(_createVM(self._zone, `scraproxy-instance-${instanceCount + n}`, instanceConfig));
          });

          Promise.all(vmPromises).then((vms) => {
              resolve(vms);
          }).catch((err) => {
              reject(err);
          });
      }));
    }

    function tagInstances(zone, ids, tag) {
      Promise.map(ids, (id) => new Promise((resolve, reject) => {
        winston.debug('[ProviderGCP] tagInstances: id:', id, tag);
        zone.vm(id).getTags()
          .then((data) => {
            const tags = data[0];
            const fingerprint = data[1];

            tags.push(tag);

            resolve(zone.vm(id).setTags(tags, fingerprint));
          });
      }));
    }
  }

  startInstance(model) {
    winston.debug('[ProviderGCP] startInstance: model=', model.toString());

    return new Promise((resolve, reject) => {  
      this._zone.vm(model.providerOpts.id).start().then(async (data) => {
        const operation = data[0];
        await operation.promise();
        resolve();
      }).catch((err) => reject(err));
    });
  }

  removeInstance(model) {
    winston.debug(
      '[ProviderGCP] removeInstance (asked): model=',
      model.toString()
    );

    this._modelsToRemove.push(model);

    return Promise.resolve();
  }

  _removeInstances(models) {
    const ids = models.map((model) => model.providerOpts.id),
      names = models.map((model) => model.toString()).join(',');

    winston.debug('[ProviderGCP] removeInstances: models=', names);

    return new Promise((resolve, reject) => {
    //   const params = {
    //     InstanceIds: ids,
    //   };

      const stopPromises = ids.map((id) => {
          this._zone
            .vm(id)
            .get()
            .then((data) => {
              const vm = data[0];
              return vm.delete();
            });
      });

      resolve(Promise.all(stopPromises));
    });
  }

};


