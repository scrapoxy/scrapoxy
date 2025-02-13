from scrapy.core.downloader.handlers.http11 import TunnelError


class ErrorSpiderMiddleware:
    def process_spider_exception(self, response, exception, spider):
        # Intercept proxied HTTP request
        if response and response.status == 557 and '"no_proxy"' in response.text:
            # Force a proxies count verification
            spider.crawler._spx_proxies_count = 0
            spider.crawler._spx_last_proxies_check = None


class ErrorDownloaderMiddleware:
    def process_exception(self, request, exception, spider):
        # Intercept proxied HTTPS request
        if isinstance(exception, TunnelError) and "'no_proxy'" in str(exception):
            # Force a proxies count verification
            spider.crawler._spx_proxies_count = 0
            spider.crawler._spx_last_proxies_check = None
