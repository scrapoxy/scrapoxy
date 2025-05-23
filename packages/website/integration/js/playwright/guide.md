# Playwright Integration

![Playwright](playwright.svg){width=250 nozoom}

[Playwright](/l/playwright) is a webscraping framework for Node.JS developed by Microsoft, 
which provides a high-level API to control Chromium, Firefox and Webkit over the DevTools Protocol.


## Step 1: Install the library

```shell
npm install playwright
```

If required, install the browser binaries:

```shell
npx playwright install --with-deps
```


## Step 2: Retrieve project credentials

![Credentials Sticky](../../credentials_sticky.png)

1. Open Scrapoxy User interface, and go to the project `Settings`;
2. Enable `Keep the same proxy with cookie injection`;
3. Remember the project's `Username`;
4. Remember the project's `Password`;
5. And click on `Update`.


## Step 3: Retrieve and install Scrapoxy Certificate

![Certificate](../../certificate.png)

1. Open Scrapoxy User interface, and go to the project `Settings`;
2. Click on `Download CA certificate` and save the file `scrapoxy-ca.crt`;
3. Remember the project's `Username`;
4. Remember the project's `Password`.

Install the certificate with the following command:

```shell
certutil -d sql:$HOME/.pki/nssdb -A -t "C,," -n scrapoxy -i ./scrapoxy-ca.crt
````


## Step 4: Create and run the script

Create a file name `make_requests.js` with the following content:

```javascript
import playwright from 'playwright';

(async () => {
    const browser = await playwright.chromium.launch({
        ignore_default_args: ["--headless"],
        args: ["--headless=new"],
        proxy: {
            server: 'http://localhost:8888',
            username: 'USERNAME',
            password: 'PASSWORD'
        },
    });

    const context = await browser.newContext({
        ignoreHTTPSErrors: true,
    });

    const page = await context.newPage();
    await page.goto('https://fingerprint.scrapoxy.io');

    const content = await page.content();
    console.log(content);

    await browser.close();
})()
    .catch(console.error);

```

Replace `USERNAME` and `PASSWORD` by the credentials you copied earlier.

::: info
All requests made in the same session will use the same proxy instance.
:::

Run the script:

```shell
node make_requests.js
```
