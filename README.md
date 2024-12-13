# Scrapoxy

## What is Scrapoxy?

Scrapoxy is a **super proxies manager** that orchestrates all your proxies into **one place 🎯**,
rather than spreading management across multiple scrapers 🕸️.

Deployed on your own infrastructure, Scrapoxy serves as a **single proxy endpoint** for your scrapers.

It creates a pool of private proxies from your datacenter subscription 🔒,
integrates them with proxy vendors 🔌, handles IP rotation and fingerprinting,
and smartly routes traffic to **avoid bans** 🚫.

<br/>

![Scrapoxy](https://raw.githubusercontent.com/scrapoxy/scrapoxy/master/packages/website/public/assets/images/scrapoxy.gif)

**🚀🚀 [GO TO SCRAPOXY.IO FOR MORE INFORMATION!](https://scrapoxy.io) 🚀🚀**


## Features

### ☁️ Datacenter Providers with easy installation ☁️

Scrapoxy supports many datacenter providers like [AWS](https://aws.amazon.com), [Azure](https://azure.com), or [GCP](https://cloud.google.com).

It installs a proxy image on each datacenter, helping the quick launch of a proxy instance.
Traffic is routed to proxy instances to provide many IP addresses.

Scrapoxy handles the startup/shutdown of proxy instances to rotate IP addresses effectively.


### 🌐 Proxy Services 🌐

Scrapoxy supports many proxy services like [Rayobyte](https://billing.rayobyte.com/hosting/aff.php?aff=2444&redirectTo=https://rayobyte.com), [IPRoyal](https://iproyal.com/?r=432273) or [Zyte](https://www.zyte.com).

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


## Documentation

More information on [scrapoxy.io](https://scrapoxy.io).


## Contributors

[![Contributors](https://contrib.rocks/image?repo=scrapoxy/scrapoxy)](https://github.com/scrapoxy/scrapoxy/graphs/contributors)

Want to contribute? Check out the [guide](https://scrapoxy.io/contrib/guidelines)!

Here is my contact on [![Linkedin Badge](https://img.shields.io/badge/-Linkedin-blue?style=flat&logo=Linkedin&logoColor=white)](https://www.linkedin.com/in/fabienvauchelles)


## Sponsorship

Scrapoxy is an open-source project.
The project is **free** for users, but it does come with **costs for me**.

I invest significant time and resources into maintaining and improving this project,
covering expenses for hosting, promotion, and more.

If you appreciate the value Scrapoxy provides and wish to support its continued development,
discuss new features, access the roadmap, or receive professional support, please consider [becoming a sponsor](https://www.buymeacoffee.com/scrapoxy)!

Your support would greatly contribute to the project's sustainability and growth:

<a href="https://www.buymeacoffee.com/scrapoxy" target="_blank"><img src="https://raw.githubusercontent.com/scrapoxy/scrapoxy/master/packages/website/public/assets/images/buymeacoffee.svg" width="230"/></a>


## Licence

See [The AGPLv3 License](https://github.com/scrapoxy/scrapoxy/blob/master/LICENCE.md).


## Acknowledgements

I would like to thank all the contributors to the project and the open-source community for their support.


## Follow-up

[![Discord](https://img.shields.io/discord/1095676356496461934?logo=discord&label=Discord&color=7289da&style=flat-square)](https://discord.gg/ktNGGwZnUD)
[![Docker](https://img.shields.io/docker/v/scrapoxy/scrapoxy?logo=docker&label=Docker&style=flat-square)](https://hub.docker.com/r/scrapoxy/scrapoxy)
[![NPM](https://img.shields.io/npm/v/scrapoxy?label=NPM&color=bc3433&style=flat-square)](https://www.npmjs.com/package/scrapoxy)

[![Star History Chart](https://api.star-history.com/svg?repos=scrapoxy/scrapoxy&type=Timeline)](https://star-history.com/#scrapoxy/scrapoxy&Timeline)
