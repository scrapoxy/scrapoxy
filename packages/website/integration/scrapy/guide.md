# Scrapy Integration

![Scrapy](scrapy.svg){width=230 nozoom}

This tutorial uses the famous Python web scraping framework [Scrapy](https://scrapy.org/). 


## Step 1: Install the framework

```shell
pip install scrapy scrapoxy
```


### Step 2: Retrieve project token

![Token](../token.png)

1. Open Scrapoxy User interface, and go to the project `Settings`;
2. Remember the project token.


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
SCRAPOXY_USERNAME = "<project_username>"
SCRAPOXY_PASSWORD = "<project_password>"
```

Replace `<project_username>` and `<project_password>` by the credentials you copied earlier.


## Step 5: Remove blacklisted instances (optional)

Scrapy uses Scrapoxy's API to kill blacklisted instance.

Edit `myproject/settings.py` and add the following lines:

```python
DOWNLOADER_MIDDLEWARES = {
    'scrapoxy.ProxyDownloaderMiddleware': 100,
    'scrapoxy.BlacklistDownloaderMiddleware': 101,
}

SCRAPOXY_BLACKLIST_HTTP_STATUS_CODES = [400, 429, 503]
SCRAPOXY_SLEEP_MIN = 60
SCRAPOXY_SLEEP_MAX = 180
```

::: tip
Add the HTTP status codes you want to blacklist in `SCRAPOXY_BLACKLIST_HTTP_STATUS_CODES`.
:::

Scrapy will pause for a duration ranging between `SCRAPOXY_SLEEP_MIN` and `SCRAPOXY_SLEEP_MAX` seconds
when no proxy instance is available.


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

