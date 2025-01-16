# Scrapoxy

## What is Scrapoxy?

Scrapoxy is a **super proxies manager** that orchestrates all your proxies into **one place 🎯**, 
rather than spreading management across multiple scrapers 🕸️.

Deployed on your own infrastructure, Scrapoxy serves as a **single proxy endpoint** for your scrapers.

It builds a pool of private proxies from your datacenter subscription 🔒, 
integrates them with proxy vendors 🔌, manages IP rotation and fingerprinting,
and smartly routes traffic to **avoid bans** 🚫.

<br/>

![Scrapoxy](/assets/images/scrapoxy.gif)


## What is not Scrapoxy?

Scrapoxy is not:
- a proxies list manager like [ProxyBroker2](https://github.com/bluet/proxybroker2);
- a webscraper like [Scrapy](https://scrapy.org), [Crawlee](https://crawlee.dev) or [Octoparse](https://www.octoparse.com);
- a cloud provider like [AWS](https://aws.amazon.com), [GCP](https://cloud.google.com) or [Azure](https://azure.microsoft.com);
- a browser farm like [Puppeteer](https://pptr.dev), [Selenium](https://www.selenium.dev) or [Playwright](https://playwright.dev);
- a proxy service like [Rayobyte](https://billing.rayobyte.com/hosting/aff.php?aff=2444&redirectTo=https://rayobyte.com), [IP Royal](https://iproyal.com/?r=432273) or [Zyte](https://refer.zyte.com/72VhrR).


## What you can do with Scrapoxy?

* Integrate it into your web scraping stack to manage proxies, whether as an **individual or a company**;
* Contribute to the project by submitting issues or pull requests;
* Distribute the code **under the AGPLv3 license**, ensuring the owner’s name remains intact.


## What you cannot do with Scrapoxy?

* Use it for any activities that are **illegal** under your jurisdiction;
* **Modify or redistribute** the source code under a license other than AGPLv3;
* Sell Scrapoxy, whether as a standalone service or **incorporated into** another product.


## Why Scrapoxy?

I started developing the Scrapoxy project in 2015. 

At that time, I was working with [Scrapy](https://scrapy.org) and encountering issues with my scrapers getting banned 😟. 
There were also few low-cost solutions for obtaining IP addresses. 
Additionally, manually installing proxies was too time-consuming and tedious 😭. 

A solution was needed to automate these tasks 🤖. 

Scrapoxy initially focused on managing the [AWS](https://aws.amazon.com) provider. 
Users could start and stop instances and **get a new IP address** each time. 

However, an essential element was missing: **the routing 🔀**. 

I integrated this part so that Scrapoxy became the only entry point for scrapers in a proxies infrastructure.
This allowed it to autonomously distribute traffic and handle proxy rotation 
when a ban was detected 🚨.

My goal was to make **proxy management accessible to everyone**, 
so I open-sourced the project under the [AGPLv3 license](licence). 
Several users requested the addition of new providers, 
and the project grew 🌱. 

Now, Scrapoxy smartly manages both **datacenter providers** and **proxy services**. 
It intercepts and modifies requests to ensure consistency in your scraping stack,
which is crucial when facing ban issues 🚨. 

Staying consistent in your scraping stack is the primary focus, 
and Scrapoxy helps you achieve that 🎯.


## Features

### ☁️ Datacenter Providers with easy installation ☁️

Scrapoxy supports many datacenter providers like [AWS](https://aws.amazon.com), [Azure](https://azure.com), or [GCP](https://cloud.google.com).

It installs a proxy image on each datacenter, helping the quick launch of a proxy instance. 
Traffic is routed to proxy instances to provide many IP addresses. 

Scrapoxy handles the startup/shutdown of proxy instances to rotate IP addresses effectively.


### 🌐 Proxy Services 🌐

Scrapoxy supports many proxy services like [Rayobyte](https://billing.rayobyte.com/hosting/aff.php?aff=2444&redirectTo=https://rayobyte.com), [IPRoyal](https://iproyal.com/?r=432273) or [Zyte](https://refer.zyte.com/72VhrR).

It connects to these services and uses a variety of parameters such as country or OS type,
to create a diversity of proxies.


### 💻 Hardware materials 💻

Scrapoxy supports many 4G proxy farms hardware types like [Proxidize](https://proxidize.com).

It uses their APIs to handle IP rotation on 4G networks.


### 📜 Free Proxy Lists 📜

Scrapoxy supports lists of HTTP/HTTPS proxies and SOCKS4/SOCKS5 proxies. 

It takes care of testing their connectivity to aggregate them into the proxy pool.


### ⏰ Timeout free ⏰

Scrapoxy only routes traffic to online proxies. 

This feature is useful with residential proxies. 
Sometimes, proxies may be too slow or inactive. 
Scrapoxy detects these offline nodes and excludes them from the proxy pool.


### 🔄 Auto-Rotate proxies 🔄

Scrapoxy automatically changes IP addresses at regular intervals. 

Scrapers can have thousands of IP addresses without managing proxy rotation.


### 🏃 Auto-Scale proxies 🏃

Scrapoxy monitors incoming traffic 
and automatically scales the number of proxies according to your needs.

It also reduces proxy count to minimize your costs.


### 🍪 Sticky sessions on Browser 🍪

Scrapoxy can keep the same IP address for a scraping session, even for browsers. 

It includes HTTP requests/responses interception mechanism to inject a session cookie,
ensuring continuity of the IP address throughout the browser session.


### 🚨 Ban management 🚨

Scrapoxy injects the name of the proxy into the HTTP responses. 

When a scraper detects that a ban has occurred, it can notify Scrapoxy to remove the proxy from the pool.


### 📡 Traffic interception 📡

Scrapoxy intercepts HTTP requests/responses to modify headers, 
keeping consistency in your scraping stack.
It can add session cookies or specific headers like user-agent.


###  📊 Traffic monitoring 📊

Scrapoxy measures incoming and outgoing traffic to provide an overview of your scraping session. 

It tracks metrics such as the number of requests, active proxy count, requests per proxy, and more.


### 🌍 Coverage monitoring 🌍

Scrapoxy displays the geographic coverage of your proxies to better understand the global distribution of your proxies.


### 🚀 Easy-to-use and production-ready 🚀

Scrapoxy is suitable for both beginners and experts. 

It can be started in seconds using Docker, or be deployed in a complex, distributed environment with Kubernetes.


### 🔓 Free and Open Source 🔓

Scrapoxy is free and open source, under the AGPLv3 license.

All contributions must remain under this license.
