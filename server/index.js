#! /usr/bin/env node

'use strict';

const _ = require('lodash'),
  Promise = require('bluebird'),
  ProviderGCP = require('./providers/gcp'),
  ProviderAWSEC2 = require('./providers/awsec2'),
  ProviderDigitalOcean = require('./providers/digitalocean'),
  ProviderOVHCloud = require('./providers/ovhcloud'),
  ProviderVscale = require('./providers/vscale'),
  fs = require('fs'),
  moment = require('moment'),
  ovh = require('ovh'),
  path = require('path'),
  program = require('commander'),
  Proxies = require('./proxies'),
  sigstop = require('./common/sigstop'),
  template = require('./template'),
  TestProxy = require('./test-proxy'),
  winston = require('winston');

const configDefaults = require('./config.defaults');


// Add timestamp to log
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {timestamp: true});


program
    .version('3.1.1')
    .option('-d, --debug', 'Debug mode (increase verbosity)', debugMode)
    .parse(process.argv);

program
    .command('start [conf.json]')
    .description('Start proxy with a configuration')
    .action((configFilename) => startProxy(configFilename));

program
    .command('init [conf.json]')
    .description('Create configuration file with a template')
    .action((configFilename) => initConfig(configFilename));

program
    .command('test [url] [count]')
    .description('Test the proxy at url')
    .action((url, count) => testProxy(url, count));

program
    .command('ovh-consumerkey [endpoint] [appKey] [appSecret]')
    .description('Get the OVH consumerKey')
    .action((endpoint, appKey, appSecret) => ovhConsumerKey(endpoint, appKey, appSecret));


program
    .parse(process.argv);

if (!program.args.length) {
    program.help();
}


////////////

function initConfig(configFilename) {
    if (!configFilename || configFilename.length <= 0) {
        return winston.error('[Template] Error: Config file not specified');
    }

    fs.exists(configFilename, (exists) => {
        if (exists) {
            return winston.error('[Template] Error: Config file already exists');
        }

        template.write(configFilename, (err) => {
            if (err) {
                return winston.error('[Template] Error: Cannot write template to', configFilename);
            }

            winston.info('[Template] Template written in', configFilename);
        });
    });
}


function startProxy(configFilename) {
    if (!configFilename || configFilename.length <= 0) {
        return winston.error('[Start] Error: Config file not specified');
    }

    configFilename = path.resolve(process.cwd(), configFilename);

    // Load config
    let config;
    try {
        config = _.merge({}, configDefaults, require(configFilename));
    }
    catch (err) {
        return winston.error('[Start] Error: Cannot load config:', err);
    }

    // Write logs (if specified)
    if (config.logs && config.logs.path) {
        winston.add(winston.transports.File, {
            filename: `${config.logs.path}/scrapoxy_${moment().format('YYYYMMDD_HHmmss')}.log`,
            json: false,
            timestamp: true,
        });
    }

    // Initialize
    const providers = getProviders(config);
    if (providers.length <= 0) {
        return winston.error('[Start] Error: Providers are not specified or supported');
    }

    const main = new Proxies(config, providers);

    // Register stop event
    sigstop(
        () => main.shutdown().then(
            () => process.exit(0)
        )
    );


    // Start
    main.listen();


    ////////////

    function getProviders(cfg) {
        return _(cfg.providers)
            .map(getProvider)
            .compact()
            .value();


        ////////////

        function getProvider(provider) {
            switch (provider.type) {
              case 'awsec2': 
              {
                return new ProviderAWSEC2(provider, cfg.instance.port);
              }
              case 'gcp': 
              {
                return new ProviderGCP(provider, cfg.instance.port);
              }

              case 'digitalocean': 
              {
                return new ProviderDigitalOcean(provider, cfg.instance.port);
              }

              case 'ovhcloud': 
              {
                return new ProviderOVHCloud(provider, cfg.instance.port);
              }

              case 'vscale': 
              {
                return new ProviderVscale(provider, cfg.instance.port);
              }

              default: 
              {
                return;
              }
            }
        }
    }
}


function testProxy(proxyUrl, count) {
    if (!proxyUrl || proxyUrl.length <= 0) {
        return winston.error('[Test] Error: URL not specified');
    }

    // Default: 10 / Max: 1000
    count = Math.min(count || 10, 1000);

    const proxy = new TestProxy(proxyUrl);

    const promises = [];
    for (let i = 0; i < count; ++i) {
        promises.push(proxy.request());
    }

    Promise
        .all(promises)
        .then(() => {
            winston.info('[Test] %d IPs found:', proxy.size);

            proxy.count.forEach(
                (value, key) => winston.info('[Test] %s (%d times)', key, value)
            );
        })
        .catch((err) => {
            winston.error('[Test] Error: Cannot get IP address:', err);
        });
}


function ovhConsumerKey(endpoint, appKey, appSecret) {
    if (!appKey || appKey.length <= 0 || !appSecret || appSecret.length <= 0) {
        return winston.error('[OVH] Error: appKey or appSecret not specified');
    }

    const client = ovh({
        endpoint,
        appKey,
        appSecret,
    });

    client.request('POST', '/auth/credential', {
        'accessRules': [
            {'method': 'GET', 'path': '/cloud/*'},
            {'method': 'POST', 'path': '/cloud/*'},
            {'method': 'PUT', 'path': '/cloud/*'},
            {'method': 'DELETE', 'path': '/cloud/*'},
        ],
    }, (err, credential) => {
        if (err) {
            return winston.error('[OVH] Error: Cannot get consumerKey:', err);
        }

        winston.info('[OVH] Your consumerKey is:', credential.consumerKey);
        winston.info('[OVH] Please validate your token here:', credential.validationUrl);
    });
}


function debugMode() {
    winston.level = 'debug';
}
