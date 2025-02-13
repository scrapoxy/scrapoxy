class Addon:
    def update_settings(self, settings):
        settings["DOWNLOADER_MIDDLEWARES"]["scrapoxy.ProxyDownloaderMiddleware"] = 100

        if settings.getbool("SCRAPOXY_WAIT_FOR_PROXIES", False):
            settings.set("SCHEDULER", "scrapoxy.ScrapoxyScheduler")
            settings["DOWNLOADER_MIDDLEWARES"]["scrapoxy.ErrorDownloaderMiddleware"] = 1050
            settings["SPIDER_MIDDLEWARES"]["scrapoxy.ErrorSpiderMiddleware"] = 1050
            scheduler = True
        else:
            scheduler = False

        if settings.getbool("SCRAPOXY_BLACKLIST_ENABLE", False):
            if not scheduler:
                raise Exception('SCRAPOXY_WAIT_FOR_PROXIES must be enabled to use SCRAPOXY_BLACKLIST_ENABLE')

            settings["DOWNLOADER_MIDDLEWARES"]["scrapoxy.BlacklistDownloaderMiddleware"] = 101

        if settings.getbool("SCRAPOXY_STICKY_ENABLE", False):
            settings["SPIDER_MIDDLEWARES"]["scrapoxy.StickySpiderMiddleware"] = 101
