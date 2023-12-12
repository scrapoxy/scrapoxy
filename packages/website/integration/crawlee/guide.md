# Crawlee Integration

![Crawlee](crawlee.svg){width=230 nozoom}

This tutorial uses the Crawlee web scraping framework [Crawlee](https://crawlee.dev). 


## Step 1: Install the framework and setup a project

```shell
npx crawlee create my-crawler
cd my-crawler
```


## Step 2: Retrieve project token

![Token](../token.png)

1. Open Scrapoxy User interface, and go to the project `Settings`;
2. Remember the project token.


## Step 3: Create a crawler

Replace content of the file `src/main.ts` by the following code:

```typescript
import {
    CheerioCrawler,
    ProxyConfiguration
} from 'crawlee';

const proxyConfiguration = new ProxyConfiguration({
    proxyUrls: [
        'http://<project_username>:<project_password>@localhost:8888',
    ]
});

const crawler = new CheerioCrawler({
    proxyConfiguration,

    ignoreSslErrors: true,

    async requestHandler({body}) {
        console.log(body.toString());
    },
});

(async () => {
    await crawler.run(['https://fingerprint.scrapoxy.io']);
})()
    .catch(console.error);
```

Replace `<project_username>` and `<project_password>` by the credentials you copied earlier.

Run the crawler:

```shell
npm start
```

