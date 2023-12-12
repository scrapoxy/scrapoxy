import * as fs from 'fs';
import axios from 'axios';
import {
    bytesToHuman,
    SpeedMonitor,
} from './speed-monitor';


const token = process.env.TOKEN as string;

if (!token) {
    throw new Error('no token specified');
}

const proxy = {
    host: process.env.PROXY_HOSTNAME ?? 'localhost',
    port: parseInt(
        process.env.PROXY_PORT ?? '8888',
        10
    ),
    protocol: 'http',
};

(async() => {
    console.log('prepare output');

    const ostream = fs.createWriteStream('./myfile.data');
    const promise = new Promise<void>((
        resolve, reject
    ) => {
        ostream.on(
            'error',
            (err) => {
                reject(err);
            }
        );

        ostream.on(
            'end',
            () => {
                resolve();
            }
        );
    });

    console.log('prepare monitor');

    const monitor = new SpeedMonitor();
    monitor.on(
        'speed',
        (counter: number) => {
            console.log(`speed: ${bytesToHuman(counter)}/s`);
        }
    );

    console.log('start request');

    const req = await axios.get(
        'https://releases.ubuntu.com/22.04.1/ubuntu-22.04.1-desktop-amd64.iso',
        {
            proxy,
            headers: {
                'proxy-authorization': `Basic ${Buffer.from(token)
                    .toString('base64')}`,
            },
            responseType: 'stream',
        }
    );

    console.log('pipe start');
    req.data.pipe(monitor)
        .pipe(ostream);

    console.log('wait for end');
    await promise;
})()
    .then(() => {
        console.log('done');
    })
    .catch((err) => {
        console.error(err);
    });
