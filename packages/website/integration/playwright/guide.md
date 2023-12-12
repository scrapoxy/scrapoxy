# Playwright Integration

![Playwright](playwright.svg){width=250 nozoom}

[Playwright](https://playwright.dev/) is a webscraping framework for Node.JS developed by Microsoft, 
which provides a high-level API to control Chromium, Firefox and Webkit over the DevTools Protocol.


### Step 1: Install the library

```shell
npm install playwright
```

If required, install the browser binaries:

```shell
npx playwright install
```


### Step 2: Retrieve project token

![Token](../token_sticky.png)

1. Open Scrapoxy User interface, and go to the project `Settings`;
2. Enable `Keep the same proxy with cookie injection`;
3. Remember the project token.


### Step 3: Create and run the script

Create a file name `playwright.js` with the following content:

```javascript
import playwright from 'playwright';

(async () => {
    const browser = await playwright.chromium.launch({
        ignore_default_args: ["--headless"],
        args: ["--headless=new"],
        proxy: {
            server: 'http://localhost:8888',
            username: '<project_username>',
            password: '<project_password>'
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

Replace `<project_username>` and `<project_password>` by the credentials you copied earlier.

::: info
All requests made in the same session will use the same proxy instance.
:::

Run the script:

```shell
node playwright.js
```
