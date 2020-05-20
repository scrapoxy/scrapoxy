'use strict';

// Check configuration
checkConfig(process.env.COMMANDER_PASSWORD, 'COMMANDER_PASSWORD');

if (emptyConfig(process.env.PROVIDERS_TYPE)) {
    checkConfig(process.env.PROVIDERS_AWSEC2_ACCESSKEYID, 'PROVIDERS_AWSEC2_ACCESSKEYID');
    checkConfig(process.env.PROVIDERS_AWSEC2_SECRETACCESSKEY, 'PROVIDERS_AWSEC2_SECRETACCESSKEY');
}

// Export configuration
module.exports = {
    proxy: {
        port: parseInt(process.env.PROXY_PORT || '8888'),
        ...setProxyAuthentication()
    },

    commander: {
        port: parseInt(process.env.COMMANDER_PORT || '8889'),

        password: process.env.COMMANDER_PASSWORD,
    },

    instance: {
        checkDelay: parseInt(process.env.INSTANCE_CHECKDELAY || '10000'),
        checkAliveDelay: parseInt(process.env.INSTANCE_CHECKALIVEDELAY || '20000'),
        stopIfCrashedDelay: parseInt(process.env.INSTANCE_STOPIFCRASHEDDELAY || '300000'),
        addProxyNameInRequest: process.env.INSTANCE_ADDPROXYNAMEINREQUEST === 'false',

        autorestart: {
            minDelay: parseInt(process.env.INSTANCE_AUTORESTART_MINDELAY || '3600000'),
            maxDelay: parseInt(process.env.INSTANCE_AUTORESTART_MAXDELAY || '43200000'),
        },

        port: parseInt(process.env.INSTANCE_PORT || '3128'),

        scaling: {
            min: parseInt(process.env.INSTANCE_SCALING_MIN || '1'),
            max: parseInt(process.env.INSTANCE_SCALING_MAX || '2'),

            downscaleDelay: parseInt(process.env.INSTANCE_SCALING_DOWNSCALEDELAY || '600000'),
        },
    },

    providers: getProvidersByType(),

    stats: {
        retention: parseInt(process.env.STATS_RETENTION || '86400000'),

        samplingDelay: parseInt(process.env.STATS_SAMPLINGDELAY || '1000'),
    },
};


////////////

function emptyConfig(value) {
    return !value || value.length <= 0;
}


function checkConfig(value, name) {
    if (emptyConfig(value)) {
        throw new Error(`Cannot find environment variable ${name}`);
    }
}

function setProxyAuthentication() {
    if (process.env.PROXY_AUTH_USERNAME && process.env.PROXY_AUTH_PASSWORD) {
        return {
            auth: {
                username: process.env.PROXY_AUTH_USERNAME,
                password: process.env.PROXY_AUTH_PASSWORD
            }
        }
    }
    return {}
}

function getProvidersByType() {
    const providerType = process.env.PROVIDERS_TYPE || 'awsec2';
    switch(providerType) {
        case 'awsec2': {
            let max;
            if (process.env.PROVIDERS_AWSEC2_MAX) {
                max = parseInt(process.env.PROVIDERS_AWSEC2_MAX);
            }

            return [{
                type: 'awsec2',
                accessKeyId: process.env.PROVIDERS_AWSEC2_ACCESSKEYID,
                secretAccessKey: process.env.PROVIDERS_AWSEC2_SECRETACCESSKEY,
                region: process.env.PROVIDERS_AWSEC2_REGION || 'eu-west-1',
                instance: {
                    InstanceType: process.env.PROVIDERS_AWSEC2_INSTANCE_INSTANCETYPE || 't1.micro',
                    ImageId: process.env.PROVIDERS_AWSEC2_INSTANCE_IMAGEID || 'ami-c74d0db4',
                    SecurityGroups: [
                        process.env.PROVIDERS_AWSEC2_INSTANCE_SECURITYGROUPS || 'forward-proxy',
                    ],
                },
                tag: process.env.PROVIDERS_AWSEC2_TAG || 'Proxy',
                max,
            }];
        }

        case 'digitalocean': {
            let max;
            if (process.env.PROVIDERS_DIGITALOCEAN_MAX) {
                max = parseInt(process.env.PROVIDERS_DIGITALOCEAN_MAX);
            }

            return [{
                type: 'digitalocean',
                token: process.env.PROVIDERS_DIGITALOCEAN_TOKEN,
                region: process.env.PROVIDERS_DIGITALOCEAN_REGION,
                size: process.env.PROVIDERS_DIGITALOCEAN_SIZE,
                sshKeyName: process.env.PROVIDERS_DIGITALOCEAN_SSHKEYNAME,
                imageName: process.env.PROVIDERS_DIGITALOCEAN_IMAGENAME,
                tags: process.env.PROVIDERS_DIGITALOCEAN_TAGS,
                name: process.env.PROVIDERS_DIGITALOCEAN_NAME || 'Proxy',
                max,
            }];
        }

        case 'ovhcloud': {
            let max;
            if (process.env.PROVIDERS_OVHCLOUD_MAX) {
                max = parseInt(process.env.PROVIDERS_OVHCLOUD_MAX);
            }

            return [{
                type: 'ovhcloud',
                endpoint: process.env.PROVIDERS_OVHCLOUD_ENDPOINT,
                appKey: process.env.PROVIDERS_OVHCLOUD_APPKEY,
                appSecret: process.env.PROVIDERS_OVHCLOUD_APPSECRET,
                consumerKey: process.env.PROVIDERS_OVHCLOUD_CONSUMERKEY,
                serviceId: process.env.PROVIDERS_OVHCLOUD_SERVICEID,
                region: process.env.PROVIDERS_OVHCLOUD_REGION,
                sshKeyName: process.env.PROVIDERS_OVHCLOUD_SSHKEYNAME,
                flavorName: process.env.PROVIDERS_OVHCLOUD_FLAVORNAME,
                snapshotName: process.env.PROVIDERS_OVHCLOUD_SNAPSHOTNAME,
                name: process.env.PROVIDERS_OVHCLOUD_NAME || 'Proxy',
                max,
            }];
        }

        case 'vscale': {
            let max;
            if (process.env.PROVIDERS_VSCALE_MAX) {
                max = parseInt(process.env.PROVIDERS_VSCALE_MAX);
            }

            return [{
                type: 'vscale',
                token: process.env.PROVIDERS_VSCALE_TOKEN,
                region: process.env.PROVIDERS_VSCALE_REGION,
                imageName: process.env.PROVIDERS_VSCALE_IMAGENAME,
                sshKeyName: process.env.PROVIDERS_VSCALE_SSHKEYNAME,
                plan: process.env.PROVIDERS_VSCALE_PLAN,
                name: process.env.PROVIDERS_VSCALE_NAME || 'Proxy',
                max,
            }];
        }

        default: {
            throw new Error(`Unknown provider: ${providerType}`);
        }
    }
}
