from base64 import b64encode


class ProxyDownloaderMiddleware(object):

    @classmethod
    def from_crawler(cls, crawler):
        return cls(crawler)

    def __init__(self, crawler):
        master = crawler.settings.get("SCRAPOXY_MASTER")
        if master:
            self._proxy = f"{master}/?noconnect"

        username = crawler.settings.get("SCRAPOXY_USERNAME")
        password = crawler.settings.get("SCRAPOXY_PASSWORD")
        if username and password:
            auth_b64 = b64encode(f"{username}:{password}".encode("utf-8")).decode("utf-8")
            self._proxy_auth = (username, password)
            self._proxy_auth_b64 = f"Basic {auth_b64}"

    def process_request(self, request, spider):
        if request.meta.get("no-proxy"):
            return

        # Don"t overwrite with a random one (server-side state for IP)
        if hasattr(self, "_proxy"):
            request.meta["proxy"] = self._proxy

            if hasattr(self, "_proxy_auth"):
                request.headers["proxy-authorization"] = self._proxy_auth_b64

            if request.meta.get("impersonate"):
                impersonate_args = request.meta.get("impersonate_args", {})
                impersonate_args["verify"] = False

                if hasattr(self, "_proxy_auth"):
                    impersonate_args["proxy_auth"] = self._proxy_auth

                request.meta["impersonate_args"] = impersonate_args
