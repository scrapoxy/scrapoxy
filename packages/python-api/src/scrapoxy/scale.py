from scrapy import signals
from scrapoxy.api import ScrapoxyApi
from time import sleep

import logging


class ScaleSpiderMiddleware(object):

    @classmethod
    def from_crawler(cls, crawler):
        return cls(crawler)

    def __init__(self, crawler):
        self._api = ScrapoxyApi(
            crawler.settings.get("SCRAPOXY_API"),
            crawler.settings.get("SCRAPOXY_USERNAME"),
            crawler.settings.get("SCRAPOXY_PASSWORD")
        )

        self._delay = crawler.settings.get("SCRAPOXY_WAIT_FOR_SCALE") or 120

        crawler.signals.connect(self.spider_opened, signals.spider_opened)
        crawler.signals.connect(self.spider_closed, signals.spider_closed)


    def spider_opened(self, spider):
        spider.log("[ScaleSpiderMiddleware] Upscale Scrapoxy", level=logging.DEBUG)

        self._api.set_project_status("HOT")

        spider.log(f"[ScaleSpiderMiddleware] Sleeping {self._delay} seconds to finish upscale", level=logging.WARNING)
        sleep(self._delay)


    def spider_closed(self, spider):
        spider.log("[ScaleSpiderMiddleware] Downscale Scrapoxy", level=logging.DEBUG)

        self._api.set_project_status("OFF")
