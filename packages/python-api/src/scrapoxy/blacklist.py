from random import randrange
from scrapy.exceptions import IgnoreRequest
from scrapoxy.api import ScrapoxyApi, is_proxy_online
from time import sleep


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
        api = crawler.settings.get("SCRAPOXY_API")
        assert api, "SCRAPOXY_API is required"

        username = crawler.settings.get("SCRAPOXY_USERNAME")
        assert username, "SCRAPOXY_USERNAME is required"

        password = crawler.settings.get("SCRAPOXY_PASSWORD")
        assert password, "SCRAPOXY_PASSWORD is required"

        self._api = ScrapoxyApi(api, username, password)

        self._http_status_codes = crawler.settings.get("SCRAPOXY_BLACKLIST_HTTP_STATUS_CODES", [429, 503])
        self._force = crawler.settings.get("SCRAPOXY_BLACKLIST_FORCE", True)
        self._sleep_min = crawler.settings.get("SCRAPOXY_SLEEP_MIN", 60)
        self._sleep_max = crawler.settings.get("SCRAPOXY_SLEEP_MAX", 180)

    def process_response(self, request, response, spider):
        if response.status not in self._http_status_codes:
            return response

        spider.logger.info("Ignoring Blacklisted response %s: HTTP status %d" % (response.url, response.status))

        id_raw = response.headers.get("x-scrapoxy-proxyname")
        if not id_raw:
            raise BlacklistError(response, "No header 'X-Scrapoxy-Proxyname' name in response headers. MITM must be enabled")

        id = id_raw.decode("utf-8")

        alive_count = 0
        views = self._api.get_all_project_connectors_and_proxies()
        for view in views:
            for proxy in view["proxies"]:
                if (proxy["id"] != id and is_proxy_online(proxy)):
                    alive_count += 1

        spider.logger.error("Remove instance %s (remaining %d instances)." % (response.url, response.status))

        self._api.ask_proxies_to_remove([
            {
                "id": id,
                "force": self._force
            }
        ])

        if alive_count <= 0:
            delay = randrange(self._sleep_min, self._sleep_max)
            spider.logger.warn("No instance remaining. Sleep for %d seconds..." % delay)
            sleep(delay)

        raise IgnoreRequest()
