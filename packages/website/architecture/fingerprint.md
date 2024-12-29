# Fingerprint Server

## What is the Fingerprint server ?

The Fingerprint Server’s primary purpose is to confirm that a given proxy is **reachable**.
If Scrapoxy cannot connect to the Fingerprint Server using a specific proxy,
it will stop routing traffic through that proxy to prevent connection timeouts.
Additionally, Scrapoxy relies on the Fingerprint Server to rotate out unresponsive proxies and maintain reliable service.

Beyond checking connectivity, the Fingerprint Server also gathers critical details about each proxy, including:

- The true IP address (which may differ from the one the proxy vendor provides)
- Geolocation data, such as the country, city, and timezone

By collecting this information, Scrapoxy can verify the actual locations of proxies worldwide and exclude any that appear suspicious or deceptive.


## Where is the Fingerprint Server hosted?

The Fingerprint Server runs on a high-availability infrastructure located in France.


## Can I host the Fingerprint Server myself?

Unfortunately, self-hosting the Fingerprint Server **is not permitted**. Here’s why:

- **Data**: The server uses a *proprietary algorithm* for IP and GEO information, not just a basic free database. This algorithm will not be released as open source.
- **Whitelisting**: Some providers require *domain whitelisting*. Significant discussions with their technical and legal teams were necessary to secure this approval.
- **Monitoring**: Tracking usage data yields valuable insights into how Scrapoxy operates (see below). This helps identify trends, troubleshoot issues, and continuously improve the service.


## How much bandwith does the Fingerprint use?

Scrapoxy periodically sends requests to the fingerprint server to verify connectivity and collect GEO information.
If a request fails, Scrapoxy will avoid using that particular proxy.

Each request is compressed and consumes approximately **600 bytes** in received bandwidth.

_Example:_

With a proxy timeout set to 20 seconds, Scrapoxy will send 3 requests per minute, totaling 180 requests per hour and 4,320 requests per day.

The bandwidth consumption per day can be calculated using the following formula:

```
Bandwidth in Mb Per Day = (# proxies / Proxy Timeout) * 49.44
```


## Which information is sent to the Fingerprint Server?

Scrapoxy transmits anonymized data to the Fingerprint Server to help improve performance and user experience. This includes:
- Scrapoxy version
- Proxy vendor in use
- Proxy usage statistics (number of requests sent and bytes received/sent)

::: info
Scrapoxy does not collect information about target websites, user agents, cookies, or any other sensitive data.
:::

Gathering these anonymized metrics helps us better understand Scrapoxy usage patterns and improve the service overall.
