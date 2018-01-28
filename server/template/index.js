'use strict';

const fs = require('fs');


module.exports = {
    write,
};


////////////

const template = {
    commander: {
        password: 'CHANGE_THIS_PASSWORD',
    },

    instance: {
        port: 3128,

        scaling: {
            min: 1,
            max: 2,
        },
    },

    providers: [
        {
            type: 'awsec2',
            accessKeyId: 'YOUR ACCESS KEY ID',
            secretAccessKey: 'YOUR SECRET ACCESS KEY',
            region: 'YOUR REGION (could be: eu-west-1)',
            instance: {
                InstanceType: 't1.micro',
                ImageId: 'ami-c74d0db4', // Forward proxy node
                SecurityGroups: ['forward-proxy'],
            },
        },

        {
            type: 'ovhcloud',
            endpoint: 'YOUR ENDPOINT (could be: ovh-eu)',
            appKey: 'YOUR APP KEY',
            appSecret: 'YOUR APP SECRET',
            consumerKey: 'YOUR CONSUMER KEY',
            serviceId: 'YOUR SERVICE ID',
            region: 'YOUR REGION (could be: BHS1, GRA1 or SBG1)',
            sshKeyName: 'YOUR SSH KEY (could be: mykey)',
            flavorName: 'vps-ssd-1',
            snapshotName: 'YOUR SNAPSHOT NAME (could be: forward-proxy)',
        },

        {
            type: 'digitalocean',
            token: 'YOUR PERSONAL TOKEN',
            region: 'YOUR REGION (could be: lon1)',
            size: '512mb',
            sshKeyName: 'YOUR SSH KEY (could be: mykey)',
            imageName: 'YOUR SNAPSHOT NAME (could be: forward-proxy)',
            tags: 'YOUR IMAGE TAGS (could be: ["myTags"])',
        },

        {
            type: 'vscale',
            token: 'YOUR PERSONAL TOKEN',
            region: 'YOUR REGION (could be: msk0, spb0)',
            imageName: 'YOUR SNAPSHOT NAME (could be: forward-proxy)',
            sshKeyName: 'YOUR SSH KEY (could be: mykey)',
            plan: 'YOUR PLAN (could be: small)',
        },
    ]
};


function write(target, done) {
    const data = JSON.stringify(template, void 0, 4);

    fs.writeFile(target, data, (err) => {
        if (err) {
            return done(err);
        }

        done();
    });
}
