# HRequests Integration 

![HRequests](hrequests.svg){width=350 nozoom}

This tutorial uses the powerful Python HTTP library [HRequests](/l/python-hrequests).


## Step 1: Install the library

```shell
pip install hrequests[all]
```


## Step 2: Retrieve CA certificate and project credentials

![Certificate](../../certificate_sticky.png)

1. Open Scrapoxy User interface, and go to the project `Settings`;
2. Enable `Keep the same proxy with cookie injection`;
3. Click on `Download CA certificate` and save the file `scrapoxy-ca.crt`;
4. Remember the project's `Username`;
5. Remember the project's `Password`.


## Step 3: Create and run the script

Create a file name `make_request.py` with the following content:

```python
import hrequests

proxy = "http://USERNAME:PASSWORD@localhost:8888"

session = hrequests.Session()

r = session.get(
    "https://fingerprint.scrapoxy.io",
    proxy=proxy,
    verify=False
)

session.close()

print("proxy instance:", r.headers["x-scrapoxy-proxyname"])

print(r.json())
```

Replace `USERNAME` and `PASSWORD` by the credentials you copied earlier.

::: info
All requests made in the same session will use the same proxy instance.
:::

Run the script:

```shell
python make_request.py
```
