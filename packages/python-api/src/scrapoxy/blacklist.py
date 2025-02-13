from random import randrange
from scrapy.exceptions import IgnoreRequest
from scrapoxy.api import ScrapoxyApi, is_proxy_online

from twisted.internet.defer import Deferred


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

        self._http_status_codes = crawler.settings.getlist("SCRAPOXY_BLACKLIST_HTTP_STATUS_CODES", [429, 503])
        self._force = crawler.settings.getbool("SCRAPOXY_BLACKLIST_FORCE", True)
        self._retry_max = crawler.settings.getint("SCRAPOXY_BLACKLIST_RETRY_MAX", 2)
        sleep = crawler.settings.get("SCRAPOXY_BLACKLIST_SLEEP", [60, 180])
        if isinstance(sleep, list):
            assert len(sleep) == 2, "SCRAPOXY_BLACKLIST_SLEEP must be a number or a range of 2 numbers"
            assert isinstance(sleep[0], int) and isinstance(sleep[1], int) and sleep[0] <= sleep[1], "SCRAPOXY_BLACKLIST_SLEEP must be a number or a range of 2 numbers"
            self._sleep = sleep
        elif isinstance(sleep, int) and not isinstance(sleep, bool):
            self._sleep = [sleep, sleep]
        else:
            assert False, "SCRAPOXY_BLACKLIST_SLEEP must be a number or a range of 2 numbers"

    def process_response(self, request, response, spider):
        if response.status not in self._http_status_codes:
            return response

        id_raw = response.headers.get("x-scrapoxy-proxyname")
        if not id_raw:
            raise BlacklistError(response, "No header 'X-Scrapoxy-Proxyname' name in response headers. MITM must be enabled")

        id = id_raw.decode("utf-8")

        spider.logger.info("Scrapoxy: Removing blacklisted instance %s for %s (HTTP status %d)" % (id, response.url, response.status))

        self._api.ask_proxies_to_remove([
            {
                "id": id,
                "force": self._force
            }
        ])

        # Force a proxies count verification 
        spider.crawler._spx_proxies_count = 0
        spider.crawler._spx_last_proxies_check = None

        new_request = request.copy()
        retry_count = request.meta.get("spx_retry_count", 0)
        if retry_count < self._retry_max:
            new_request.meta["spx_retry_count"] = retry_count + 1
            new_request.dont_filter = True
           
            delay = randrange(self._sleep[0], self._sleep[1] + 1)
            if delay > 0:
                spider.logger.info("Scrapoxy: Add %d seconds delay to replay request %s" % (delay, response.url))
            
                # Get reactor here to avoid reactors conflict issues
                from twisted.internet import reactor
                deferred = Deferred()
                reactor.callLater(delay, deferred.callback, new_request)
                return deferred
            else:
                return new_request
        else:
            raise IgnoreRequest('Ignoring blacklisted response %s (HTTP status %d) with too many retries (%d): ' % (response.url, response.status, retry_count))

