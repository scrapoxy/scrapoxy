from random import randrange
from scrapy.exceptions import IgnoreRequest
from scrapoxy.api import ScrapoxyApi, is_proxy_online
from time import sleep

import logging


class BlacklistError(Exception):
    def __init__(self, response, message, *args, **kwargs):
        super(BlacklistError, self).__init__(*args, **kwargs)

        self.response = response
        self.message = message

    def __str__(self):
        return self.message


class BlacklistDownloaderMiddleware(object):

    @classmethod
    def from_crawler(cls, crawler):
        return cls(crawler)

    def __init__(self, crawler):
        """Access the settings of the crawler to connect to Scrapoxy.
        """
        self._http_status_codes = crawler.settings.get("SCRAPOXY_BLACKLIST_HTTP_STATUS_CODES", [429, 503])
        self._sleep_min = crawler.settings.get("SCRAPOXY_SLEEP_MIN", 60)
        self._sleep_max = crawler.settings.get("SCRAPOXY_SLEEP_MAX", 180)

        self._api = ScrapoxyApi(
                crawler.settings.get("SCRAPOXY_API"),
                crawler.settings.get("SCRAPOXY_USERNAME"),
                crawler.settings.get("SCRAPOXY_PASSWORD")
            )

    def process_response(self, request, response, spider):
        if response.status not in self._http_status_codes:
            return response

        spider.log(f"Ignoring Blacklisted response {response.url}: HTTP status {response.status}", level=logging.DEBUG)

        id = response.headers["x-scrapoxy-proxyname"].decode("utf-8")

        alive_count = 0
        views = self._api.get_all_project_connectors_and_proxies()
        for view in views:
            for proxy in view["proxies"]:
                if (proxy["id"] != id and is_proxy_online(proxy)):
                    alive_count += 1

        spider.log(f"Remove instance {id} (remaining {alive_count} instances).", level=logging.ERROR)
        self._api.ask_proxies_to_remove([
            {
                "id": id,
                "force": True
            }
        ])

        if alive_count <= 0:
            delay = randrange(self._sleep_min, self._sleep_max)
            spider.log(f"No instance remaining. Sleep for {delay} seconds...", level=logging.INFO)
            sleep(delay)

        raise IgnoreRequest()
