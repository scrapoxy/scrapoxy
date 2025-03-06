# Requests Integration 

![Requests](requests.svg){width=180 nozoom}

This tutorial uses the famous Python HTTP library [Requests](/l/python-requests).

## Step 1: Install the library

```shell
pip install requests
```


## Step 2: Retrieve CA certificate and project credentials

![Certificate](../../certificate.png)

1. Open Scrapoxy User interface, and go to the project `Settings`;
2. Click on `Download CA certificate` and save the file;
3. Remember the project's `Username`;
4. Remember the project's `Password`.

::: info
It is assumed that file is saved in `/tmp/scrapoxy-ca.crt`.
:::


## Step 3: Create and run the script

Create a file name `make_requests.py` with the following content:

```python
import requests

ca = "/tmp/scrapoxy-ca.crt"
proxy = "http://USERNAME:PASSWORD@localhost:8888"

r = requests.get(
    "https://fingerprint.scrapoxy.io",
    proxies={"http": proxy, "https": proxy},
    verify=ca
)

print("proxy instance:", r.headers["x-scrapoxy-proxyname"])

print(r.json())
```

Replace `USERNAME` and `PASSWORD` by the credentials you copied earlier.

Scrapoxy includes a `x-scrapoxy-proxyname` header in each response,
indicating the name of the proxy instance assigned for the request.

Run the script:

```shell
python make_requests.py
```


## Step 4: Sticky session (optional)

To reuse the same proxy instance for all requests, add the following line:

```python
import requests

ca = "/tmp/scrapoxy-ca.crt"
proxy = "http://USERNAME:PASSWORD@localhost:8888"
headers={
    'X-Scrapoxy-Proxyname': 'PROXYNAME'
}

r = requests.get(
    "https://fingerprint.scrapoxy.io",
    headers=headers,
    proxies={"http": proxy, "https": proxy},
    verify=ca
)

print("proxy instance:", r.headers["x-scrapoxy-proxyname"])
```

Replace `PROXYNAME` by the proxy instance name you want to use.
