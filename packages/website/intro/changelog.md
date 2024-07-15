# Changelog

## 4.11.1

### Features

- **smartproxy**: added support for [Smartproxy](https://smartproxy.pxf.io/Qy5mVo) datacenter pay per GB product


## 4.11.0

### Features

- **smartproxy**: added support for [Smartproxy](https://smartproxy.pxf.io/Qy5mVo)
- **task**: enabled naming tasks for better identification

### Bug fixes

- **test**: fixed issues with fingerprints in tests.
- **misc**: updated and corrected some documentation and naming conventions


## 4.10.2

### Bug fixes

- **transport**: fix usage of username & password for SOCKS proxy


## 4.10.1

### Features

- **azure**: add support for Spot Instance (thanks to [Julien Maitrehenry](https://github.com/jmaitrehenry))
- **fingerprint**: use GET instead of POST method to access fingerprint server (to bypass firewall restrictions)

### Bug fixes

- **azure**: handle running deployment to avoid duplicate instances creation 


## 4.10.0

### Features

- **brightdata**: add support for Residential and Mobile proxies for [BrightData](https://get.brightdata.com/khkl3keb25ld)
- **fingerprint**: use GET instead of POST method to access fingerprint server (to bypass firewall restrictions)

### Bug fixes

- **website**: misc fixes


## 4.9.0

### Features

- **netnut**: add [NetNut](https://netnut.io?ref=ymzmmmu) connector

### Bug fixes

- **sticky**: correct cookie injection for sticky sessions



## 4.8.1

### Bug fixes

- **ninjasproxy**: update the API url


## 4.8.0

### Features

- **success rate**: add success rate metrics to proxies and project

### Bug fixes

- **gcp**: fix copy/paste with GCP private key


## 4.7.2

### Bug fixes

- **freeproxy**: include auth info in key generation


## 4.7.1

### Bug fixes

- **frontend**: correct proxy URL parsing
- **frontend**: show proxies error message
- **transport**: set transport type to proxy level


## 4.7.0

### Features

- **brightdata**: add BrightData connector for ISP and DC proxies
- **backend**: add Swagger endpoint for scraper API
- **frontend**: show coupon in marketplace

### Bug fixes

- **misc**: many small corrections


## 4.6.2

### Features

- **frontend**: add coupon field in marketplace
- **proxy-seller**: add proxy-seller coupon


## 4.6.1

### Features

- **master**: add HTTPS support to master


## 4.6.0

### Features

- **proxy-seller**: add [Proxy-Seller connector](https://proxy-seller.com/?partner=GR930FP5IOO78P)

### Bug fixes

- **metrics**: include request and response headers size in metrics
- **website**: add stickies session documentation


## 4.5.2

### Bug fixes

- **aws**: use the correct architecture to install and create instances
- **log**: don't throw error if there is no configuration file at startup


## 4.5.1

### Features

- **frontend**: auto-generate a free name at credential and connector creation
- **website**: add scrapy-impersonate documentation to scrapy

### Bug fixes

- **aws**: add new instance type like t4g.nano
- **freeproxy**: allow bracket in URLs
- **transport**: add missing timeout on connections
- **log**: add more log at startup
- **website**: reorganize the documentation tree


## 4.5.0

### Features

- **freeproxies**: collect freeproxies from an URL at specified interval
- **proxies**: make timeout configurable to detect online/offline status of proxies
- **proxies**: make timeout configurable for removing offline proxies
- **freeproxies**: add a configurable timeout to detect online/offine status of freeproxies
- **freeproxies**: add a configurable timeout for removing offline freeproxies
- **api**: add an API endpoint to manage freeproxies and sources

### Refactor

- **connectors**: merge all connectors into 3 fixed directory (common, frontend, backend)
- **storage**: merge all storages into 2 fixed directory (common, backend)
- **auth**: merge all authentications into 2 fixed directory (common, backend)
- **website**: reorganize website and documentation structure for connectors
- **website**: manage plural text in toasts

### Bug fixes

- **linter**: fix linter for HTML and CSS
- **frontend**: correct pagination component
- **socks**: allow socks in connect tunnel mode


## 4.4.2

### Bug fixes

- **proxy-cheap**: fix website url


## 4.4.1

### Bug fixes

- **github**: add script to build and publish docker image and npm package


## 4.4.0

### Features

- **proxy-cheap**: add Proxy-Cheap connectors
- **hypeproxy**: add HypeProxy connector


## 4.3.0

### Features

- **nimble**: add Nimble connector with Nimble IP

### Bug fixes

- **refactor**: rename cloud to datacenter
- **frontend**: fix clipboard issue with old browser
- **misc**: correct some naming, documentation
- **storage**: allow empty file for file storage


## 4.2.3

### Bug fixes

- **commander**: log commander http error on console
- **frontend**: more stable clipboard copy


## 4.2.2

### Bug fixes

- **standalone**: force standalone mode when no option is selected


## 4.2.1

### Features

- **fingerprint**: add useragent for all http calls (fingerprint and api)
- **frontend**: split token in username and password in project settings

### Bug fixes

- **package.json**: add missing socks package


## 4.2.0

### Features

- **freeproxies**: support HTTPS proxies
- **freeproxies**: support SOCKS4/SOCKS5 proxies

### Bug fixes

- **protocol**: Accept only HTTP and HTTPS requests from master


## 4.1.6

### Bug fixes

- **frontend**: correct pagination component
- **doc**: replace local search with algolia
- **doc**: misc documentation fixes


## 4.1.5

### Bug fixes

- **auth**: `secure` flag for the authentication cookie is now optional;
- **doc**: usage of username:password is better explained.


## 4.1.4

### Bug fixes

- **fingerprint**: better fingerprint


## 4.1.3

### Bug fixes

- **doc**: correct link to picture
- **backend-app**: add version to package-lock.json in build

## 4.1.2

### Bug fixes

- **doc**: add warning for xproxy installation 
- **doc**: improve documentation and website
- **eslint**: merge scrapoxy-linter repository into scrapoxy repository


## 4.1.1

### Bug fixes

- **iproyal**: add migration layer for file storage


## 4.1.0

### Features

- **iproyal**: add support for Royal Residential proxies
- **marketplace**: add marketplace menu with static proxies, dynamic proxies, hardware, datacenter providers and other

### Bug fixes

- **transport**: factorize code for residential proxies


## 4.0.1

### Bug fixes

- **master**: handle writeHead error after aborted connection 


## 4.0.0

Scrapoxy 4 represents a complete rewrite, now developed in Typescript.
It harnesses the capabilities of [NestJS](https://nestjs.com) and [Angular](https://angular.io) modules to enhance its functionality and efficiency.

Scrapoxy 4 represents a complete rewrite, now developed in Typescript. 

### Features

::: warning BREAKING CHANGE
Scrapoxy 4 is not compatible with previous versions.
:::

- **datacenter providers**: it supports main datacenter providers like AWS, Azure, GCP and more;
- **proxy services**: it is compatible with proxy provider like Zyte, IPRoyal, Rayobyte and more;
- **hardware materials**: it orchestrates 4G proxy farms hardware types, like Proxidize or XProxy.io;
- **free proxy lists**: it handles manual lists of HTTP/HTTPS proxies;
- **auto-scale**: it autoscale up and down proxies to optimize costs;
- **auto-rotate**: it rotates proxies to avoid bans;
- **sticky sessions**: it supports sticky sessions to keep the same IP address for a scraping session or a browser
- **traffic interception**: it intercepts HTTP and HTTPS traffic to inject consistent headers or cookies;
- **monitoring**: it monitors proxies and provides many statistics;


## 3.1.1

### Bug fixes

- **master**: use correctly writeEnd in socket and request (thanks to Ben Lavalley)


## 3.1.0

### Features

- **mitm**: decrypt & encrypt SSL requests to add headers (like **x-cache-proxyname**). Compatible with HTTPS requests in PhantomJS.
- **domains**: manage whitelist or blacklist for urls (idea from Jonathan Wiklund)
- **docs**: add **ami-485fbba5** with type t2.micro

### Bug fixes

- **logs**: correct export path of logs
- **docs**: correct documentation
- **ssl**: add servername in the TLS connect (bug with HELLO)
- **pinger**: use reject instead of throw error (crash program). Thanks to Anis Gandoura.

## 3.0.1

### Features

- **digitalocean**: support Digital Ocean tags on Droplets. Thanks to Ben Lavalley.

### Bug fixes

- **digitalocean**: use new image size (s-1vcpu-1gb instead of 512mb)

## 3.0.0

::: warning BREAKING CHANGE
The configuration of providers changes.
:::

### Features

- **providers**: uses multiple providers at a time
- **awsec2**: provider removes instances in batch every second (and no longer makes thousands of queries)
- **ovhcloud**: provider creates instances in batch (new API route used)

### Bug fixes

- **maxRunningInstances**: remove blocking parameters maxRunningInstances


## 2.4.3

### Bug fixes

- **node**: change minimum version of Node.js to 8
- **dependencies**: upgrade dependencies to latest version

## 2.4.2

### Bug fixes

- **useragent**: set useragent at instance creation, not at startup
- **instance**: force crashed instance to be removed


## 2.4.1

### Bug fixes

- **instance**: correctly remove instance when instance is removed. Thanks to Étienne Corbillé.


## 2.4.0

### Features

- **provider**: add VScale.io provider. Thanks to Hotrush.

### Bug fixes

- **proxy**: use a valid startup script for init.d. Thanks to Hotrush.
- **useragent**: change useragents with a fresh list for 2017


## 2.3.10

### Features

- **docs**: add **ami-06220275** with type t2.nano

### Bug fixes

- **instance**: remove listeners on instance alive status on instance removal. Thanks to Étienne Corbillé.


## 2.3.9

### Features

- **digitalocean**: update Digital Ocean documentation
- **digitalocean**: view only instances from selected region
- **instances**: remove random instances instead of the last ones
- **pm2**: add kill_timeout option for PM2 (thanks to cp2587)

### Bug fixes

- **digitalocean**: limit the number of created instances at each API request
- **digitalocean**: don't remove locked instances


## 2.3.8

### Features

- **docker**: create the Docker image fabienvauchelles/scrapoxy

### Bug fixes

- **template**: limit max instances to 2


## 2.3.7

### Features

- **connect**: scrapoxy accepts now full HTTPS CONNECT method. It is useful for browser like PhantomJS. Thanks to Anis Gandoura


## 2.3.6

### Bug fixes

- **template**: replace old AWS AMI by **ami-c74d0db4**


## 2.3.5

::: warning BREAKING CHANGE
Please rebuild instance image.
:::

### Features

- **instance**: change Node.js version to 6.x
- **ping**: use an HTTP ping instead a TCP ping.


## 2.3.4

### Features

- **stats**: monitor stop count history
- **stats**: add 3 more scales: 5m, 10m and 1h
- **logs**: normalize logs and add more informations
- **scaling**: pop a message when maximum number of instances is reached in a provider
- **scaling**: add quick scaling buttons
- **docs**: explain why Scrapoxy doesn't accept CONNECT mode
- **docs**: explain how User Agent is overwritten

### Bug fixes

- **dependencies**: upgrade dependencies
- **ovh**: monitor **DELETED** status
- **docs**: add example to test scrapoxy with credentials
- **commander**: manage twice instance remove


## 2.3.3

### Bug fixes

- **master**: sanitize bad request headers
- **proxy**: catch all socket errors in the proxy instance


## 2.3.2

### Bug fixes

- **docs**: fallback to markdown for README (because npmjs doesn't like retext)


## 2.3.1

### Features

- **docs**: add tutorials for Scrapy and Node.js

### Bug fixes

- **digitalocean**: convert Droplet id to string


## 2.3.0

### Features

- **digitalocean**: add support for DigitalOcean provider


## 2.2.1

### Misc

- **config**: rename `my-config.json` to `conf.json`
- **doc**: migrate documentation to ReadTheDocs
- **doc**: link to the new website Scrapoxy.io


## 2.2.0

::: warning BREAKING CHANGE
node minimum version is now **4.2.1**, to support JS class
:::

### Features

- **all**: migrate core and gui to **ES6**, with all best practices
- **api**: replace Express by Koa


### Bug fixes

- **test**: correct core e2e test


## 2.1.2

### Bug fixes

- **gui**: correct token encoding for GUI


## 2.1.1

### Bug fixes

- **main**: add message when all instances are stopped (at end)
- **doc**: correct misc stuff in doc


## 2.1.0

### Features

- **ovh**: add OVH provider with documentation
- **security**: add basic auth to Scrapoxy (RFC2617)
- **stats**: add flow stats
- **stats**: add scale for stats (1m/1h/1d)
- **stats**: store stats on server
- **stats**: add globals stats
- **doc**: split of the documentation in 3 parts: quick start, standard usage and advanced usage
- **doc**: add tutorials for AWS / EC2
- **gui**: add a scaling popup instead of direct edit (with integrity check)
- **gui**: add update popup when the status of an instance changes.
- **gui**: add error popup when GUI cannot retrieve data
- **logs**: write logs to disk
- **instance**: add cloud name
- **instance**: show instance IP
- **instance**: always terminate an instance when stopping (prefer terminate instead of stop/start)
- **test**: allow more than 8 requests (max 1000)
- **ec2**: force to terminate/recreate instance instead of stop/restart

### Bug fixes

- **gui**: emit event when scaling is changed by engine (before, event was triggered by GUI)
- **stability**: correct a lot of behavior to prevent instance cycling
- **ec2**: use status name instead of status code


## 2.0.1

### Features

- **test**: specify the count of requests with the test command
- **test**: count the requests by IP in the test command
- **doc**: add GUI documentation
- **doc**: add API documentation
- **doc**: explain awake/asleep mode in user manual
- **log**: add human readable message at startup


## 2.0.0

::: warning BREAKING CHANGE
API routes are prefixed with `/api`
:::

### Features

- **gui**: add GUI to control Scrapoxy
- **gui**: add statistics to the GUI (count of requests / minute, average delay of requests / minute)
- **doc**: add doc about HTTP headers


## 1.1.0

### Features

- **commander**: stopping an instance returns the new count of instances
- **commander**: password is hashed with base64
- **commander**: read/write config with command (and live update of the scaling)

### Misc

- **chore**: force global install with NPM


## 1.0.2

### Features

- **doc**: add 2 AWS / EC2 tutorials


### Bug fixes

- **template**: correct template mechanism
- **config**: correct absolute path for configuration


## 1.0.1

### Misc

- **doc**: change author and misc informations


## 1.0.0

### Features

- **init**: start of the project
