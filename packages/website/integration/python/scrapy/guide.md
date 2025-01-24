# Scrapy Integration

![Scrapy](scrapy.svg){width=230 nozoom}

This tutorial uses the famous Python web scraping framework [Scrapy](/l/scrapy). 


## Step 1: Install the framework

```shell
pip install scrapy scrapoxy
```


### Step 2: Retrieve project credentials

![Credentials](../../credentials.png)

1. Open Scrapoxy User interface, and go to the project `Settings`;
2. Remember the project's `Username`;
3. Remember the project's `Password`.


## Step 3: Create a new project

Create a new Scrapy project:

```shell
scrapy startproject myproject
cd myproject
```

And add a new spider:

```shell
scrapy genspider myspider mydomain.com
```


## Step 4: Add Scrapoxy usage

Edit `myproject/settings.py` and modify the following lines:

```python
DOWNLOADER_MIDDLEWARES = {
    'scrapoxy.ProxyDownloaderMiddleware': 100,
}

SCRAPOXY_MASTER = "http://localhost:8888"
SCRAPOXY_API = "http://localhost:8890/api"
SCRAPOXY_USERNAME = "USERNAME"
SCRAPOXY_PASSWORD = "PASSWORD"
```

Replace `USERNAME` and `PASSWORD` by the credentials you copied earlier.


## Step 5: Remove blacklisted instances (optional)

Scrapy uses Scrapoxy's API to kill blacklisted instances.

Edit `myproject/settings.py` and add the following lines:

```python
DOWNLOADER_MIDDLEWARES = {
    'scrapoxy.ProxyDownloaderMiddleware': 100,
    'scrapoxy.BlacklistDownloaderMiddleware': 101,
}

SCRAPOXY_BLACKLIST_HTTP_STATUS_CODES = [400, 429, 503]
SCRAPOXY_BLACKLIST_FORCE = True
SCRAPOXY_SLEEP_MIN = 60
SCRAPOXY_SLEEP_MAX = 180
```

This middleware requires **enabling MITM** in Scrapoxy.

::: tip
Add the HTTP status codes you want to blacklist in `SCRAPOXY_BLACKLIST_HTTP_STATUS_CODES`.
:::

Scrapy will pause for a duration ranging between `SCRAPOXY_SLEEP_MIN` and `SCRAPOXY_SLEEP_MAX` seconds
when no proxy instance is available.

If `SCRAPOXY_BLACKLIST_FORCE` is set to `True`, the middleware will automatically enforce instance removal.
This feature is only available for certain connector types, indicated by the presence of a `Trash` icon in the Scrapoxy UI.


## Step 6: Auto-scale the scraping session (optional)

Scrapy can start instances at the beginning of a session 
and terminate them when the session finishes.

Edit `myproject/settings.py` and add the following lines:

```python
SPIDER_MIDDLEWARES = {
   "scrapoxy.ScaleSpiderMiddleware": 100,
}

SCRAPOXY_WAIT_FOR_SCALE = 120
```

Scrapy will wait for a duration of `SCRAPOXY_WAIT_FOR_SCALE` seconds before initiating the scraping session,
allowing time for the instances to be ready.


## Step 7: Sticky session (optional)

Scrapy can use the same proxy instance for a set of chained requests.

Edit `myproject/settings.py` and add the following lines:

```python
SPIDER_MIDDLEWARES = {
   "scrapoxy.StickySpiderMiddleware": 101,
}
```

This middleware requires **enabling MITM** in Scrapoxy.


## Step 8: Render page with Splash using Scrapy and Scrapoxy (optional)

Before using Splash, follow the [Splash integration guide](../splash/guide.md).

Afterward, install the library:

```shell
pip install scrapy-splash
```

Then, add the following lines to `settings.py`:

```python
SPLASH_URL = "http://localhost:8050"

DOWNLOADER_MIDDLEWARES = {
    "scrapy_splash.SplashCookiesMiddleware": 723,
    "scrapy_splash.SplashMiddleware": 725,
    "scrapy.downloadermiddlewares.httpcompression.HttpCompressionMiddleware": 810,
}
SPIDER_MIDDLEWARES = {
    "scrapy_splash.SplashDeduplicateArgsMiddleware": 100,
}

DUPEFILTER_CLASS = 'scrapy_splash.SplashAwareDupeFilter'
HTTPCACHE_STORAGE = 'scrapy_splash.SplashAwareFSCacheStorage'

```

Here is an example of spider:

```python
from scrapy import Spider
from scrapy_splash import SplashRequest

class SplashSpider(Spider):
    name = "splash"

    def start_requests(self):
        yield SplashRequest(
            "https://example.com",
            self.parse,
            args={
                "wait": 1,
                "proxy": "http://USERNAME:PASSWORD@HOST_IP:8888",
            }
        )

    def parse(self, response):
        print(response.body)
```

Replace `USERNAME` and `PASSWORD` with the previously copied credentials,
and `HOST_IP` with the IP address of the machine running Scrapoxy.


## Step 9: Integrate scrapy-impersonate (optional)

The library [scrapy-impersonate](/l/scrapy-impersonate) is a Scrapy download handler.
This project integrates [curl_cffi](/l/curl-cffi) to perform HTTP requests,
so it can impersonate browsers' TLS signatures or JA3 fingerprints.

::: warning
Using this library to change the TLS fingerprint disables Scrapoxy's MITM functionality. 
Also, `BlacklistDownloaderMiddleware` and `StickySpiderMiddleware` do not work with `scrapy-impersonate`.
:::

To use it, first install the package:

```shell
pip install scrapy-impersonate
```

And add the following lines to `settings.py`:

```python
TWISTED_REACTOR = "twisted.internet.asyncioreactor.AsyncioSelectorReactor"

DOWNLOAD_HANDLERS = {
    "http": "scrapy_impersonate.ImpersonateDownloadHandler",
    "https": "scrapy_impersonate.ImpersonateDownloadHandler",
}
```

Here is an example of how to use `scrapy-impersonate`:

```python
class ExampleSpider(Spider):
    name = "example"
    allowed_domains = ["browserleaks.com"]

    def start_requests(self):
        yield Request(
            url="https://tls.browserleaks.com/json",
            dont_filter=True,
            meta={
                "impersonate": "chrome110",
            },
            callback=self.parse
        )
```

In this example, the request will emulate a Chrome 110 browser,
but you have the flexibility to choose from [many other useragents](/l/scrapy-impersonate-browsers).

::: info
The middleware `scrapoxy.ProxyDownloaderMiddleware` is compatible with `scrapy-impersonate`.
It will set the `verify` option to `False` and the proxy authentication.
:::

Also, remember to turn **off** `Intercept HTTPS requests with MITM`:

![Project Settings MITM](project_settings_mitm.png)

Otherwise, Scrapoxy will use a **Node.js** TLS fingerprint to connect to the website,
bypassing the `scrapy-impersonate` TLS fingerprint.

