# NodeJS Integration

![NodeJS](nodejs.svg){width=230 nozoom}

## Axios

[Axios](https://axios-http.com) is a library to make HTTP requests. It handles CA certificate and proxy.

::: info
The `https-proxy-agent` library lacks support for these features.
Consequently, using node `https` or` node-fetch` libraries is not feasible.
:::


### Step 1: Install the library

```shell
npm install axios
```


### Step 2: Retrieve CA certificate and project token

![Certificate](../certificate.png)

1. Open Scrapoxy User interface, and go to the project `Settings`;
2. Click on `Download CA certificate` and save the file;
3. Remember the project token.

::: info
It is assumed that file is saved in `/tmp/scrapoxy-ca.crt`.
:::


### Step 3: Create and run the script

Create a file name `axios.js` with the following content:

```javascript
import axios from 'axios';
import fs from 'fs';
import { Agent } from 'https';

(async () => {
    const ca = fs.readFileSync('/tmp/scrapoxy-ca.crt');

    const res = await axios.get(
        'https://fingerprint.scrapoxy.io',
        {
            proxy: {
                host: 'localhost',
                port: 8888,
                protocol: 'http',
                auth: {
                    username: '<project_username>',
                    password: '<project_password>'
                },
            },
            httpsAgent: new Agent({
                ca,
            }),
        },
    );
    
    console.log('proxy instance:', res.headers['x-scrapoxy-proxyname']);
    console.log(res.data);
})()
    .catch(console.error);
```

Replace `<project_username>` and `<project_password>` by the credentials you copied earlier.

Scrapoxy includes a `x-scrapoxy-proxyname` header in each response, 
indicating the name of the proxy instance assigned for the request.

Run the script:

```shell
node axios.js
```


### Step 4: Sticky session (optional)

To reuse the same proxy instance for all requests, add the following line:

```javascript
import axios from 'axios';
import fs from 'fs';
import { Agent } from 'https';

(async () => {
    const ca = fs.readFileSync('/tmp/scrapoxy-ca.crt');

    const res = await axios.get(
        'https://fingerprint.scrapoxy.io',
        {
            headers: {
                'X-Scrapoxy-Proxyname': '<proxyname>',
            },
            proxy: {
                host: 'localhost',
                port: 8888,
                protocol: 'http',
                auth: {
                    username: '<project_username>',
                    password: '<project_password>'
                },
            },
            httpsAgent: new Agent({
                ca,
            }),
        },
    );
    
    console.log('proxy instance:', res.headers['x-scrapoxy-proxyname']);
    console.log(res.data);
})()
    .catch(console.error);
```

Replace `<proxyname>` by the proxy instance name you want to use.
