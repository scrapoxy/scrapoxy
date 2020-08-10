======================================
Manage blocklisted request with Scrapy
======================================


Goal
====

A scraper is downloading pages of a website.

However, the website has a rate limit by IP.
When the scraper downloads 10 pages, the website returns only an empty page with a HTTP 429 status.

Does the scraper must wait when the limit is reached ? **No**!

The scraper has to ask Scrapoxy to replace the instance.


Step 1: Create a Scraper
========================

See :doc:`../python-scrapy/index` to create the scraper.


Edit settings of Scrapoxy
-------------------------

Add this content to :code:`myscraper/settings.py`::

    CONCURRENT_REQUESTS_PER_DOMAIN = 1
    RETRY_TIMES = 0

    # PROXY
    PROXY = 'http://127.0.0.1:8888/?noconnect'

    # SCRAPOXY
    API_SCRAPOXY = 'http://127.0.0.1:8889/api'
    API_SCRAPOXY_PASSWORD = 'CHANGE_THIS_PASSWORD'

    # blocklistING
    blocklist_HTTP_STATUS_CODES = [ 503 ]

    DOWNLOADER_MIDDLEWARES = {
        'scrapoxy.downloadmiddlewares.proxy.ProxyMiddleware': 100,
        'scrapoxy.downloadmiddlewares.wait.WaitMiddleware': 101,
        'scrapoxy.downloadmiddlewares.scale.ScaleMiddleware': 102,
        'scrapy.downloadermiddlewares.httpproxy.HttpProxyMiddleware': None,
        'scrapoxy.downloadmiddlewares.blocklist.blocklistDownloaderMiddleware': 950,
    }


.. WARNING::
    Don't forget to change the password!


Edit settings of the Scraper
----------------------------

Change the password of the commander in :code:`my-config.json`::

    "commander": {
        "password": "CHANGE_THIS_PASSWORD"
    },


.. WARNING::
    Don't forget to change the password!
