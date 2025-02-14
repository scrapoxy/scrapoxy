from scrapoxy.api import ScrapoxyApi, is_proxy_online
from scrapy import signals
from scrapy.core.scheduler import Scheduler
from scrapy.crawler import Crawler

import logging
import time
import scrapoxy


logger = logging.getLogger(__name__)


class ScrapoxyScheduler(Scheduler):
    def __init__(self, crawler, *args, **kwargs):
        super().__init__(crawler=crawler, *args, **kwargs)
        
        api = crawler.settings.get('SCRAPOXY_API')
        assert api, "SCRAPOXY_API setting is required"
    
        username = crawler.settings.get('SCRAPOXY_USERNAME')
        assert username, "SCRAPOXY_USERNAME setting is required"
    
        password = crawler.settings.get('SCRAPOXY_PASSWORD')
        assert password, "SCRAPOXY_PASSWORD setting is required"
    
        self._mode_start = crawler.settings.get('SCRAPOXY_MODE_START', 'HOT')
        assert self._mode_start in (None, 'HOT', 'WARM', 'COLD'), "SCRAPOXY_MODE_START must be HOT, WARM, OFF, or None"
    
        self._mode_restart = crawler.settings.get('SCRAPOXY_MODE_RESTART')
        assert self._mode_restart in (None, 'HOT', 'WARM', 'COLD', 'OFF'), "SCRAPOXY_MODE_RESTART must be HOT, WARM, COLD, OFF, or None"
    
        self._mode_stop = crawler.settings.get('SCRAPOXY_MODE_STOP')
        assert self._mode_stop in (None, 'HOT', 'WARM', 'COLD', 'OFF'), "SCRAPOXY_MODE_STOP must be HOT, WARM, COLD, OFF, or None"
    
        self._proxies_check = crawler.settings.getint('SCRAPOXY_PROXIES_CHECK', 10)
        assert self._proxies_check > 0, "SCRAPOXY_PROXIES_CHECK must be greater than 0"

        self._api = ScrapoxyApi(api, username, password)

        crawler._spx_proxies_count = 0
        crawler._spx_last_proxies_check = None
    
        crawler.signals.connect(self.spider_opened, signal=signals.spider_opened)
        crawler.signals.connect(self.spider_closed, signal=signals.spider_closed)

    def spider_opened(self, spider):
        if self._mode_start:
            logger.info("Change project mode to '%s' when launching the spider" % (self._mode_start))
            self._api.set_project_status(self._mode_start)

    def spider_closed(self, spider):
        if self._mode_stop:
            logger.info("Change project mode to '%s' when closing the spider" % (self._mode_stop))
            self._api.set_project_status(self._mode_stop)

    def next_request(self):
        now = time.time()
        if self.crawler._spx_last_proxies_check is None or now - self.crawler._spx_last_proxies_check > self._proxies_check:
            self.crawler._spx_last_proxies_check = now
            
            proxies = self._api.get_all_project_connectors_and_proxies()

            self.crawler._spx_proxies_count = 0
            self.crawler._spx_connectors_count = 0
            for connector in proxies or []:
                if connector['connector']['active']:
                    self.crawler._spx_connectors_count += 1
                
                for proxy in connector.get('proxies', []):
                    if is_proxy_online(proxy):
                        self.crawler._spx_proxies_count += 1

            if self.crawler._spx_proxies_count <= 0:
                if self.crawler._spx_connectors_count <= 0:
                    logger.warning("No proxy online AND no connector active")
                else:
                    logger.warning("No proxy online")

                if self._mode_restart:
                    project = self._api.get_project()
                    if project['status'] != self._mode_restart:
                        logger.info("Invalid project mode '%s'. Change to '%s'" % (project['status'], self._mode_restart))
                        self._api.set_project_status(self._mode_restart)

        if self.crawler._spx_proxies_count <= 0:
            return None
        
        return super().next_request()
