# Questions & Answers

This section provides answers to frequently asked questions from users.

For any unanswered questions, feel free to ask on [Discord](/l/discord-scrapoxy).


## General

### How to bypass Anti-Bot systems?

I recommend watching this video on how anti-bot systems work and techniques to bypass them:

<iframe width="560" height="315" src="https://www.youtube.com/embed/0S5SRT-WIUo?si=b5eBtJF6qmlOtrJo" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>


### Can I access to the master without username:password (e.g. http://localhost:8888) ?

Scrapoxy typically uses a `username:password` combination to select the appropriate project 
and as a security measure to prevent unauthorized access to the master.

However, you can bypass this security layer by using the [proxy-chain](/l/proxy-chain) library.
    
```js
const puppeteer = require('puppeteer');
const proxyChain = require('proxy-chain');

(async() => {
    const proxyUrl = await proxyChain.anonymizeProxy({
        url: 'http://username:password@localhost:8888',
        port: 38888
    });

    // Prints something like "http://127.0.0.1:38888"
    console.log(proxyUrl);

    const browser = await puppeteer.launch({
        args: [`--proxy-server=${proxyUrl}`],
    });

    // Do your magic here...
    const page = await browser.newPage();
    await page.goto('https://www.example.com');
    await page.screenshot({ path: 'example.png' });
    await browser.close();

    // Clean up
    await proxyChain.closeAnonymizedProxy(proxyUrl, true);
})();
```

## Licence

### Can I modify or use part (or all) the source code?

**Yes but...** 

Scrapoxy is licenced under the [AGPL-3.0 Licence](licence), 
which is quite restrictive. You are free to modify the code, but you must follow these conditions:

- **Same License**: All modifications must remain under the AGPL-3.0 license. If you include any portion of Scrapoxy’s code into your own project, the entire project must also adopt the AGPL-3.0 license.
- **Link Back**: A link to the original Scrapoxy repository must be provided.
- **Credit the Author**: The original authors must be acknowledged in your modified version.
- **Public Release**: Your modified source code must be made publicly available.

In other words, you cannot simply copy/paste, translate in another language, 
or pick parts of Scrapoxy’s code without releasing your work under the AGPL-3.0 license and meeting the terms above.

If you want to contribute to Scrapoxy, check out the [Guidelines](../contrib/guidelines).


### Can I use Scrapoxy in my commercial infrastructure ?

**Yes!** 

You can deploy Scrapoxy in a commercial environment to perform website scraping without having to reference the author or source code, 
as you’re simply using it "as-is."

Nevertheless, a friendly "Hi" or "Thank you" on the Discord channel is always appreciated 😉.


### Can I distribute Scrapoxy along with my software ?

**No, you can't.** 

Doing so would be treated as modifying or extracting parts of Scrapoxy’s source code without releasing your work under the AGPL-3.0 license and meeting all required terms.

If you’re interested in bundling Scrapoxy with your own software, please get in touch via Discord. A commercial license is available for this purpose.


## Fingerprint Server

Please check the [Fingerprint Server](../architecture/fingerprint) section for more information.


## Errors

### I've got an error `no such file or directory, open 'scrapoxy.json'` at startup

This is a standard warning that occurs during the initial launchof Scrapoxy
when the configuration file has not been created yet.

Subsequently, you may encounter the following error:

```shell
Cannot read store: ENOENT: no such file or directory, open 'scrapoxy.json' 
```


### At login, I've got the error `JwtInvalidError: JWT is invalid: JWT missing`

This error can occur for the following reasons:

1. Incorrect login/password;
2. When returning to the UI with outdated cookies, requiring a re-login;
3. If Scrapoxy is hosted on HTTP but the `FRONTEND_SECURE_COOKIE` environment variable is set to 1.


### Instances are never up

There can be multiple reasons for this error:

![Instances never up](instances_never_up.png)

#### Cause 1: Adding an existing connector to an installation

When adding a connector from a prior setup, be aware that the certificate, won't be transferred.
This discrepancy arises because Scrapoxy embeds a unique TLS certificate within the instance image to secure communication with the Master.
As a result, the certificate may not match between the existing instance and the newly integrated Scrapoxy connector.
To address this issue, it's recommended to uninstall and then reinstall the connector for proper synchronization.

#### Cause 2: Deploying a single image across multiple zones or regions

It's important to note that most cloud providers restrict the use of a image across various zones or regions.
It is recommended to perform a separate connector installation for each new zone or region you wish to operate in.

#### Cause 3: Firewall forbids Scrapoxy access to instances

Scrapoxy needs the ability to access the open port (default is 3128) on the instance.
This access facilitates the acquisition of the instance's fingerprint and enables the proper relay of traffic.
Ensure that your firewall settings include a rule that permits this access.

#### Cause 4:  Improper connector installation

In some cases, the installation may fail silently without providing any indication. 
If this occurs, the only solution is to uninstall and then reinstall the connector. 
Fortunately, this issue is rare and usually happens only during the installation process rather than during normal operation.


## Proxy

### Can I add my own proxies such as Squid with Scrapoxy?

Yes, Scrapoxy allows for the incorporation of personal proxies.
It supports proxy lists with the [free proxies connector](../connectors/freeproxies/guide) to integrate them.


### Why does Scrapoxy not support multiple IP addresses for a single instance?

In theory, it's possible with cloud providers.
We can integrate multiple IPs and network interfaces. However, it boils down to economics.
When you lease an instance, it includes a public IP at no additional cost.
Adding extra IPs incurs additional charges, and for the cheapest instances, the cost of an extra IP can be nearly as much as the instance itself.
Moreover, there's a limit on the number of extra IPs you can add to an instance type, complicating cost-effectiveness.
