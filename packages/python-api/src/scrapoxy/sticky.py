from scrapy import Request


class StickySpiderMiddleware:
    # Propagate proxyname between responses and requests to have sticky session
    def process_spider_output(self, response, result, spider):
        proxyname = response.headers.get("x-scrapoxy-proxyname")
        if proxyname:
            for r in result:
                if isinstance(r, Request):
                    r.headers["x-scrapoxy-proxyname"] = proxyname
                yield r
        else:
            yield from result
