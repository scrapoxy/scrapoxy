from base64 import b64encode
from urllib.request import Request, urlopen
from typing import TypedDict, List

import json


def is_proxy_online(proxy):
    return (
        proxy['status'] == 'STARTED' and
        proxy['fingerprint'] and
        not proxy['removing']
    )


class IProxyToRemove(TypedDict):
    id: str
    force: bool


class ScrapoxyApi:
    def __init__(self, url: str, username: str, password: str):
        self._url = f"{url}/scraper"
        self._token = b64encode(f"{username}:{password}".encode("utf-8")).decode("utf-8")

    def get_project(self):
        req = Request(
            url=f"{self._url}/project",
            headers={
                "Authorization": f"Basic {self._token}"
            }
        )
        contents = urlopen(req).read()
        return json.loads(contents)

    def set_project_status(self, status: str):
        payload = {"status": status}
        req = Request(
            url = f"{self._url}/project/status",
            method="POST",
            headers={
                "Authorization": f"Basic {self._token}",
                "Content-Type": "application/json"
            },
            data=json.dumps(payload).encode("utf-8")
        )
        urlopen(req).read()

    def get_all_project_connectors_and_proxies(self):
        req = Request(
            url=f"{self._url}/project/connectors",
            headers={
                "Authorization": f"Basic {self._token}"
            }
        )
        contents = urlopen(req).read()
        return json.loads(contents)

    def ask_proxies_to_remove(self, proxies_ids: List[IProxyToRemove]):
        req = Request(
            url=f"{self._url}/project/proxies/remove",
            method="POST",
            headers={
                "Authorization": f"Basic {self._token}",
                "Content-Type": "application/json"
            },
            data=json.dumps(proxies_ids).encode("utf-8")
        )
        urlopen(req).read()
