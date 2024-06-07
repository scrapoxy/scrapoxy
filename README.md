# Scrapoxy

## What is Scrapoxy?

Scrapoxy is a **super proxy aggregator**, allowing you to manage all proxies in **one place 🎯**,
rather than spreading it across multiple scrapers 🕸️.

It also smartly handles **traffic routing 🔀** to minimize bans and increase **success rates 🚀**.

<br/>

![Scrapoxy](https://raw.githubusercontent.com/fabienvauchelles/scrapoxy/master/packages/website/public/assets/images/scrapoxy.gif)

**🚀🚀 [GO TO SCRAPOXY.IO FOR MORE INFORMATION!](https://scrapoxy.io) 🚀🚀**


## Features

### ☁️ Datacenter Providers with easy installation ☁️

Scrapoxy supports many datacenter providers like [AWS](https://aws.amazon.com), [Azure](https://azure.com), or [GCP](https://cloud.google.com).

It installs a proxy image on each datacenter, helping the quick launch of a proxy instance.
Traffic is routed to proxy instances to provide many IP addresses.

Scrapoxy handles the startup/shutdown of proxy instances to rotate IP addresses effectively.


### 🌐 Proxy Services 🌐

Scrapoxy supports many proxy services like [Rayobyte](https://rayobyte.com), [IPRoyal](https://iproyal.com/?r=432273) or [Zyte](https://www.zyte.com).

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

And of course, Scrapoxy remains free and open source, under the MIT license.

I simply ask you to give me **credit** if you redistribute or use it in a project 🙌.

A warm thank-you message is appreciated as well 😃🙏.


## Licence

See [The MIT License (MIT)](https://github.com/fabienvauchelles/scrapoxy/blob/master/LICENCE.md)


## Follow-up

[![Discord](https://img.shields.io/discord/1095676356496461934?logo=discord&label=Discord&color=7289da&style=flat-square)](https://discord.gg/ktNGGwZnUD)
[![Docker](https://img.shields.io/docker/v/fabienvauchelles/scrapoxy?logo=docker&label=Docker&style=flat-square)](https://hub.docker.com/r/fabienvauchelles/scrapoxy)
[![NPM](https://img.shields.io/npm/v/scrapoxy?label=NPM&color=bc3433&style=flat-square)](https://www.npmjs.com/package/scrapoxy)

[![Star History Chart](https://api.star-history.com/svg?repos=fabienvauchelles/scrapoxy&type=Timeline)](https://star-history.com/#fabienvauchelles/scrapoxy&Timeline)
